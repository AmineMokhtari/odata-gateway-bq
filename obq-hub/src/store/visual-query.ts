import { create } from 'zustand'
import { 
  type Node, 
  type Edge, 
  applyNodeChanges, 
  applyEdgeChanges,
  type OnNodesChange,
  type OnEdgesChange
} from '@xyflow/react'
import { fetchNeighborhoodAction, getDatasetMetricsAction, getDatasetSchema } from '@/app/actions/schema'
import { toast } from 'sonner'
import { 
  type TelemetryEvent, 
  type TelemetryEventType, 
  createTelemetryEvent, 
  sendTelemetryBatch 
} from '@/lib/telemetry-beacon'

export interface VisualQueryState {
  nodes: Node[]
  edges: Edge[]
  activeTable: string | null
  isLoading: boolean
  selected_paths: string[]
  lastAccessed: Record<string, number>
  
  datasetMetrics: { tableCount: number, relationshipCount: number } | null
  isFallbackMode: boolean
  metricsStatus: 'idle' | 'loading' | 'success' | 'error'
  schemaVersion: string | null
  
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  setActiveTable: (tableName: string | null) => void
  setIsLoading: (loading: boolean) => void
  
  loadDatasetMetrics: (projectId: string, datasetId: string) => Promise<void>
  loadFullSchema: (projectId: string, datasetId: string) => Promise<void>
  loadNeighborhood: (projectId: string, datasetId: string, table: string) => Promise<void>
  triggerAsyncLayout: (nodes: Node[], edges: Edge[]) => void
  toggleNodePin: (nodeId: string) => void
  expandNodeNeighborhood: (projectId: string, datasetId: string, nodeId: string) => Promise<void>
  
  toggleNodeSelection: (nodeId: string) => void
  toggleEdgeSelection: (edgeId: string) => void
  toggleColumnSelection: (tableName: string, colName: string) => void
  updateNodeAccess: (nodeId: string) => void
  clearCanvas: () => void
  hydrateFromUrl: (activeTable: string, selectedPaths: string[], projectId: string, datasetId: string) => Promise<void>
  applyLRUPruning: (nodes: Node[], edges: Edge[]) => { prunedNodes: Node[], prunedEdges: Edge[] }
  pruneUnauthorizedPaths: (unauthorizedTable: string) => void
  
  // Story 14.2 Telemetry
  event_queue: TelemetryEvent[]
  sessionId: string
  enqueueEvent: (type: TelemetryEventType, metadata?: Record<string, string | number | boolean>) => void
  flushTelemetry: () => void
}

/**
 * Zustand Visual Query Store
 * Manages the React Flow graph nodes and edges for schema exploration.
 */
export const useVisualQueryStore = create<VisualQueryState>((set, get) => ({
  nodes: [],
  edges: [],
  activeTable: null,
  isLoading: false,
  selected_paths: [],
  lastAccessed: {},
  datasetMetrics: null,
  isFallbackMode: false,
  metricsStatus: 'idle',
  schemaVersion: null,
  
  // Telemetry state
  event_queue: [],
  sessionId: typeof window !== 'undefined' 
    ? (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)) 
    : '',

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  
  onNodesChange: (changes) => set({
    nodes: applyNodeChanges(changes, get().nodes)
  }),
  
  onEdgesChange: (changes) => set({
    edges: applyEdgeChanges(changes, get().edges)
  }),

  setActiveTable: (tableName) => set({ activeTable: tableName }),
  setIsLoading: (loading) => set({ isLoading: loading }),

  loadDatasetMetrics: async (projectId, datasetId) => {
    set({ metricsStatus: 'loading' })
    try {
      const metrics = await getDatasetMetricsAction(projectId, datasetId)
      if (!metrics) {
        set({ metricsStatus: 'error' })
        return
      }

      const isFallback = metrics.tableCount >= 50 || metrics.relationshipCount >= 100
      set({
        datasetMetrics: metrics,
        isFallbackMode: isFallback,
        metricsStatus: 'success',
        schemaVersion: metrics.schemaVersion || null
      })
    } catch (e) {
      console.error('[VisualQueryStore] Failed to load dataset metrics:', e)
      set({ metricsStatus: 'error' })
    }
  },

  loadFullSchema: async (projectId, datasetId) => {
    set({ isLoading: true })
    try {
      const data = await getDatasetSchema(projectId, datasetId)
      if (!data || !data.tables) {
        set({ isLoading: false })
        return
      }

      const newNodes: Node[] = []
      const newEdges: Edge[] = []

      data.tables.forEach((t: any) => {
        newNodes.push({
          id: t.name,
          type: 'tableNode',
          position: { x: 0, y: 0 },
          data: {
            label: t.name,
            isRoot: false,
            columns: t.columns || [],
            partitionColumn: t.partitionColumn,
            requiresPartitionFilter: t.requiresPartitionFilter,
            projectId,
            datasetId
          }
        })

        const relations = t.relationships || []
        relations.forEach((rel: any) => {
          const edgeId = rel.name || `edge-${t.name}-${rel.referencedTable}`
          if (!newEdges.some(e => e.id === edgeId)) {
            newEdges.push({
              id: edgeId,
              source: t.name,
              target: rel.referencedTable,
              type: 'smoothstep',
              animated: true,
              label: `${rel.column} ➔ ${rel.referencedColumn}`,
              data: {
                type: rel.type
              }
            })
          }
        })
      })

      set({ nodes: newNodes, edges: newEdges, isLoading: false, schemaVersion: data.schemaVersion || null })
      get().triggerAsyncLayout(newNodes, newEdges)
    } catch (error) {
      console.error('[VisualQueryStore] Failed to load full schema:', error)
      set({ isLoading: false })
    }
  },

  loadNeighborhood: async (projectId, datasetId, table) => {
    set({ isLoading: true, activeTable: table })
    try {
      const data = await fetchNeighborhoodAction(projectId, datasetId, table)
      if (!data) {
        set({ isLoading: false })
        return
      }

      const currentSchemaVersion = get().schemaVersion
      const newSchemaVersion = data.schemaVersion || null

      if (currentSchemaVersion && newSchemaVersion && currentSchemaVersion !== newSchemaVersion) {
        // Schema update detected! Clear canvas and show Toast.
        get().enqueueEvent('schema_drift_detected', { oldVersion: currentSchemaVersion, newVersion: newSchemaVersion })
        get().clearCanvas()
        set({ schemaVersion: newSchemaVersion, isLoading: false })
        toast.error('Schema update detected. Visual builder has been refreshed to reflect the latest changes.', {
          duration: 5000,
          position: 'top-center'
        })
        return
      }

      if (!currentSchemaVersion && newSchemaVersion) {
        set({ schemaVersion: newSchemaVersion })
      }

      // Simple grid/circular layout for Story 10.2 scaffolding
      const centerX = 300
      const centerY = 250
      const radius = 250

      const newNodes: Node[] = [
        {
          id: data.table,
          type: 'tableNode',
          position: { x: centerX, y: centerY },
          data: {
            label: data.table,
            isRoot: true,
            partitionColumn: data.partitionColumn,
            requiresPartitionFilter: data.requiresPartitionFilter,
            columns: data.columns,
            projectId,
            datasetId
          }
        }
      ]

      const newEdges: Edge[] = []

      // Lay out related tables in a circle around the root node
      const relations = data.relationships || []
      relations.forEach((rel: any, index: number) => {
        const angle = (index / relations.length) * 2 * Math.PI
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)
        const targetTable = rel.referencedTable

        // Add node for related table if not already present
        if (!newNodes.some(n => n.id === targetTable)) {
          newNodes.push({
            id: targetTable,
            type: 'tableNode',
            position: { x, y },
            data: {
              label: targetTable,
              isRoot: false,
              columns: [], // Columns will lazy load when expanded or clicked
              projectId,
              datasetId
            }
          })
        }

        // Add visual link edge
        newEdges.push({
          id: rel.name || `edge-${data.table}-${targetTable}`,
          source: data.table,
          target: targetTable,
          type: 'smoothstep',
          animated: true,
          label: `${rel.column} ➔ ${rel.referencedColumn}`,
          data: {
            type: rel.type
          }
        })
      })

      get().updateNodeAccess(data.table)
      
      // Apply LRU pruning if nodes count exceeds 200
      const { prunedNodes, prunedEdges } = get().applyLRUPruning(newNodes, newEdges)

      set({ nodes: prunedNodes, edges: prunedEdges, isLoading: false })
      get().triggerAsyncLayout(prunedNodes, prunedEdges)
    } catch (error) {
      console.error('[VisualQueryStore] Failed to load neighborhood:', error)
      set({ isLoading: false })
    }
  },

  triggerAsyncLayout: (nodes, edges) => {
    if (typeof window === 'undefined') return

    try {
      const worker = new Worker(
        new URL('../workers/layout.worker.ts', import.meta.url)
      )

      worker.onmessage = (event) => {
        const { nodes: layoutedNodes } = event.data
        if (layoutedNodes && layoutedNodes.length > 0) {
          const currentNodes = get().nodes
          const mergedNodes = layoutedNodes.map((ln: any) => {
            const originalNode = currentNodes.find(n => n.id === ln.id)
            if (originalNode && originalNode.data?.isPinned) {
              return originalNode
            }
            return ln
          })
          set({ nodes: mergedNodes })
        }
        worker.terminate()
      }

      worker.postMessage({ nodes, edges })
    } catch (err) {
      console.error('[VisualQueryStore] Web Worker layout failed, using circular layout fallback:', err)
    }
  },

  toggleNodePin: (nodeId) => {
    const node = get().nodes.find(n => n.id === nodeId)
    const isPinned = node?.data?.isPinned ?? false
    get().enqueueEvent('node_pinned', { nodeId, isPinned: !isPinned })

    set({
      nodes: get().nodes.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              isPinned: !node.data?.isPinned
            }
          }
        }
        return node
      })
    })
  },

  expandNodeNeighborhood: async (projectId, datasetId, nodeId) => {
    const currentNodes = get().nodes
    const targetNode = currentNodes.find(n => n.id === nodeId)
    if (!targetNode || targetNode.data?.isExpanded) return

    get().enqueueEvent('table_expanded', { nodeId, projectId, datasetId })
    get().enqueueEvent('neighborhood_expanded', { nodeId, projectId, datasetId })

    set({ isLoading: true })
    get().updateNodeAccess(nodeId)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const data = await fetchNeighborhoodAction(projectId, datasetId, nodeId)
      clearTimeout(timeoutId)

      if (!data) {
        set({ isLoading: false })
        return
      }

      const currentSchemaVersion = get().schemaVersion
      const newSchemaVersion = data.schemaVersion || null

      if (currentSchemaVersion && newSchemaVersion && currentSchemaVersion !== newSchemaVersion) {
        // Schema update detected! Clear canvas and show Toast.
        get().enqueueEvent('schema_drift_detected', { oldVersion: currentSchemaVersion, newVersion: newSchemaVersion })
        get().clearCanvas()
        set({ schemaVersion: newSchemaVersion, isLoading: false })
        toast.error('Schema update detected. Visual builder has been refreshed to reflect the latest changes.', {
          duration: 5000,
          position: 'top-center'
        })
        return
      }

      if (!currentSchemaVersion && newSchemaVersion) {
        set({ schemaVersion: newSchemaVersion })
      }

      const updatedNodes = currentNodes.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              isExpanded: true,
              partitionColumn: data.partitionColumn,
              requiresPartitionFilter: data.requiresPartitionFilter,
              columns: data.columns,
              projectId,
              datasetId
            }
          }
        }
        return node
      })

      const newEdges = [...get().edges]
      const relations = data.relationships || []
      const angleStep = (2 * Math.PI) / Math.max(relations.length, 1)

      relations.forEach((rel: any, index: number) => {
        const targetTable = rel.referencedTable
        const edgeId = rel.name || `edge-${nodeId}-${targetTable}`

        if (!updatedNodes.some(n => n.id === targetTable)) {
          const angle = index * angleStep
          const distance = 300
          const x = targetNode.position.x + distance * Math.cos(angle)
          const y = targetNode.position.y + distance * Math.sin(angle)

          updatedNodes.push({
            id: targetTable,
            type: 'tableNode',
            position: { x, y },
            data: {
              label: targetTable,
              isRoot: false,
              columns: [],
              projectId,
              datasetId
            }
          })
        }

        if (!newEdges.some(e => e.id === edgeId)) {
          newEdges.push({
            id: edgeId,
            source: nodeId,
            target: targetTable,
            type: 'smoothstep',
            animated: true,
            label: `${rel.column} ➔ ${rel.referencedColumn}`,
            data: {
              type: rel.type
            }
          })
        }
      })

      // Apply LRU pruning if nodes count exceeds 200
      const { prunedNodes, prunedEdges } = get().applyLRUPruning(updatedNodes, newEdges)

      set({ nodes: prunedNodes, edges: prunedEdges, isLoading: false })
      get().triggerAsyncLayout(prunedNodes, prunedEdges)
    } catch (error: any) {
      clearTimeout(timeoutId)
      console.error('[VisualQueryStore] Failed to expand neighborhood for node:', nodeId, error)
      set({ isLoading: false })
    }
  },

  toggleNodeSelection: (nodeId) => {
    const selectedPaths = get().selected_paths
    const isSelected = selectedPaths.includes(nodeId)
    get().enqueueEvent('query_selected', { nodeId, type: 'table', action: isSelected ? 'deselect' : 'select' })

    const nextPaths = isSelected
      ? selectedPaths.filter(p => p !== nodeId && !p.startsWith(`${nodeId}.`))
      : [...selectedPaths, nodeId]

    set({ selected_paths: nextPaths })
    get().updateNodeAccess(nodeId)
  },

  toggleEdgeSelection: (edgeId) => {
    const edge = get().edges.find(e => e.id === edgeId)
    if (!edge) return

    const selectedPaths = get().selected_paths
    const isSourceSelected = selectedPaths.includes(edge.source)
    const isTargetSelected = selectedPaths.includes(edge.target)

    if (!isSourceSelected || !isTargetSelected) {
      toast.error('Both tables must be selected first before selecting their relationship edge.', {
        description: 'Click the tables to select them first.'
      })
      return
    }

    const joinKey = `${edge.source}->${edge.target}`
    const isSelected = selectedPaths.includes(joinKey)
    get().enqueueEvent('edge_selected', { edgeId, source: edge.source, target: edge.target, action: isSelected ? 'deselect' : 'select' })

    const nextPaths = isSelected
      ? selectedPaths.filter(p => p !== joinKey)
      : [...selectedPaths, joinKey]

    set({ selected_paths: nextPaths })
  },

  toggleColumnSelection: (tableName, colName) => {
    const selectedPaths = get().selected_paths
    const colKey = `${tableName}.${colName}`
    
    // Ensure table is selected if a column inside it is selected
    let nextPaths = [...selectedPaths]
    if (!nextPaths.includes(tableName)) {
      nextPaths.push(tableName)
    }

    const isSelected = nextPaths.includes(colKey)
    get().enqueueEvent('column_selected', { tableName, column: colName, action: isSelected ? 'deselect' : 'select' })

    nextPaths = isSelected
      ? nextPaths.filter(p => p !== colKey)
      : [...nextPaths, colKey]

    set({ selected_paths: nextPaths })
    get().updateNodeAccess(tableName)
  },

  updateNodeAccess: (nodeId) => {
    set(state => ({
      lastAccessed: {
        ...state.lastAccessed,
        [nodeId]: Date.now()
      }
    }))
  },

  clearCanvas: () => {
    get().enqueueEvent('canvas_cleared')
    set({
      nodes: [],
      edges: [],
      selected_paths: [],
      activeTable: null,
      lastAccessed: {}
    })
  },

  hydrateFromUrl: async (activeTable, selectedPaths, projectId, datasetId) => {
    set({ isLoading: true, activeTable, selected_paths: selectedPaths })
    try {
      const rootData = await fetchNeighborhoodAction(projectId, datasetId, activeTable)
      if (!rootData) {
        set({ isLoading: false })
        return
      }

      const centerX = 300
      const centerY = 250
      const radius = 250

      const newNodes: Node[] = [
        {
          id: rootData.table,
          type: 'tableNode',
          position: { x: centerX, y: centerY },
          data: {
            label: rootData.table,
            isRoot: true,
            partitionColumn: rootData.partitionColumn,
            requiresPartitionFilter: rootData.requiresPartitionFilter,
            columns: rootData.columns,
            projectId,
            datasetId
          }
        }
      ]

      const newEdges: Edge[] = []
      const relations = rootData.relationships || []
      relations.forEach((rel: any, index: number) => {
        const angle = (index / relations.length) * 2 * Math.PI
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)
        const targetTable = rel.referencedTable

        if (!newNodes.some(n => n.id === targetTable)) {
          newNodes.push({
            id: targetTable,
            type: 'tableNode',
            position: { x, y },
            data: {
              label: targetTable,
              isRoot: false,
              columns: [],
              projectId,
              datasetId
            }
          })
        }

        newEdges.push({
          id: rel.name || `edge-${rootData.table}-${targetTable}`,
          source: rootData.table,
          target: targetTable,
          type: 'smoothstep',
          animated: true,
          label: `${rel.column} ➔ ${rel.referencedColumn}`,
          data: {
            type: rel.type
          }
        })
      })

      get().updateNodeAccess(activeTable)

      // Lazy load only the other selected tables
      const otherTables = selectedPaths.filter(p => !p.includes('.') && !p.includes('->') && p !== activeTable)
      
      for (const table of otherTables) {
        try {
          const data = await fetchNeighborhoodAction(projectId, datasetId, table)
          if (data) {
            const nodeIndex = newNodes.findIndex(n => n.id === table)
            if (nodeIndex >= 0) {
              newNodes[nodeIndex] = {
                ...newNodes[nodeIndex],
                data: {
                  ...newNodes[nodeIndex].data,
                  isExpanded: true,
                  partitionColumn: data.partitionColumn,
                  requiresPartitionFilter: data.requiresPartitionFilter,
                  columns: data.columns,
                  projectId,
                  datasetId
                }
              }
            } else {
              newNodes.push({
                id: table,
                type: 'tableNode',
                position: { x: centerX + 200, y: centerY + 200 },
                data: {
                  label: table,
                  isRoot: false,
                  isExpanded: true,
                  partitionColumn: data.partitionColumn,
                  requiresPartitionFilter: data.requiresPartitionFilter,
                  columns: data.columns,
                  projectId,
                  datasetId
                }
              })
            }

            const tableRelations = data.relationships || []
            tableRelations.forEach((rel: any) => {
              const targetTable = rel.referencedTable
              const edgeId = rel.name || `edge-${table}-${targetTable}`

              if (!newNodes.some(n => n.id === targetTable)) {
                newNodes.push({
                  id: targetTable,
                  type: 'tableNode',
                  position: { x: centerX + 300, y: centerY + 300 },
                  data: {
                    label: targetTable,
                    isRoot: false,
                    columns: []
                  }
                })
              }

              if (!newEdges.some(e => e.id === edgeId)) {
                newEdges.push({
                  id: edgeId,
                  source: table,
                  target: targetTable,
                  type: 'smoothstep',
                  animated: true,
                  label: `${rel.column} ➔ ${rel.referencedColumn}`,
                  data: {
                    type: rel.type
                  }
                })
              }
            })
            
            get().updateNodeAccess(table)
          }
        } catch (err) {
          console.error(`Failed to lazy load hydration table ${table}:`, err)
        }
      }

      const { prunedNodes, prunedEdges } = get().applyLRUPruning(newNodes, newEdges)
      set({ nodes: prunedNodes, edges: prunedEdges, isLoading: false })
      get().triggerAsyncLayout(prunedNodes, prunedEdges)
    } catch (error) {
      console.error('[VisualQueryStore] Failed to hydrate:', error)
      set({ isLoading: false })
    }
  },

  applyLRUPruning: (nodes, edges) => {
    if (nodes.length <= 200) {
      return { prunedNodes: nodes, prunedEdges: edges }
    }

    const selectedPaths = get().selected_paths
    const activeTable = get().activeTable
    const lastAccessed = get().lastAccessed

    const pruneCandidates = nodes.filter(node => {
      if (node.id === activeTable) return false
      if (selectedPaths.includes(node.id)) return false
      return true
    })

    pruneCandidates.sort((a, b) => {
      const timeA = lastAccessed[a.id] ?? 0
      const timeB = lastAccessed[b.id] ?? 0
      return timeA - timeB
    })

    const excessCount = nodes.length - 200
    const prunedIdsList = pruneCandidates.slice(0, excessCount).map(n => n.id)
    const prunedIds = new Set(prunedIdsList)

    if (prunedIds.size === 0) {
      return { prunedNodes: nodes, prunedEdges: edges }
    }

    get().enqueueEvent('lru_pruned', { 
      prunedCount: prunedIdsList.length, 
      prunedTables: prunedIdsList.join(',') 
    })

    const prunedNodes = nodes.filter(node => !prunedIds.has(node.id))
    const prunedEdges = edges.filter(edge => !prunedIds.has(edge.source) && !prunedIds.has(edge.target))

    return { prunedNodes, prunedEdges }
  },

  pruneUnauthorizedPaths: (unauthorizedTable) => {
    const selectedPaths = get().selected_paths
    const nextPaths = selectedPaths.filter(path => {
      // 1. Column selection
      if (path.includes('.') && !path.includes('->')) {
        const [table] = path.split('.')
        return table.toLowerCase() !== unauthorizedTable.toLowerCase()
      }
      // 2. Join edge
      if (path.includes('->')) {
        const [source, target] = path.split('->')
        return source.toLowerCase() !== unauthorizedTable.toLowerCase() && target.toLowerCase() !== unauthorizedTable.toLowerCase()
      }
      // 3. Plain table
      return path.toLowerCase() !== unauthorizedTable.toLowerCase()
    })

    const nextNodes = get().nodes.filter(n => n.id.toLowerCase() !== unauthorizedTable.toLowerCase())
    const nextEdges = get().edges.filter(e => e.source.toLowerCase() !== unauthorizedTable.toLowerCase() && e.target.toLowerCase() !== unauthorizedTable.toLowerCase())

    set({ 
      selected_paths: nextPaths,
      nodes: nextNodes,
      edges: nextEdges
    })

    get().triggerAsyncLayout(nextNodes, nextEdges)
  },

  enqueueEvent: (type, metadata) => {
    const event = createTelemetryEvent(type, metadata)
    set(state => ({
      event_queue: [...state.event_queue, event]
    }))

    if (telemetryFlushTimeout) {
      clearTimeout(telemetryFlushTimeout)
    }
    telemetryFlushTimeout = setTimeout(() => {
      get().flushTelemetry()
    }, 2000)
  },

  flushTelemetry: () => {
    const { event_queue, sessionId } = get()
    if (event_queue.length === 0) return

    set({ event_queue: [] })

    const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3005'
    const endpoint = `${gatewayUrl}/v1/telemetry`
    const batch = {
      events: event_queue,
      clientVersion: '1.0.0',
      sessionId
    }

    sendTelemetryBatch(endpoint, batch)
  }
}))

let telemetryFlushTimeout: any = null

if (typeof window !== 'undefined') {
  (window as any).__ZUSTAND_STORE__ = useVisualQueryStore;
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      useVisualQueryStore.getState().flushTelemetry()
    }
  })
  window.addEventListener('pagehide', () => {
    useVisualQueryStore.getState().flushTelemetry()
  })
}
