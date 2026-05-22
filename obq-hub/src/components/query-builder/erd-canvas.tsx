import React, { useEffect, useState } from 'react'
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useVisualQueryStore } from '@/store/visual-query'
import { TableNode } from './table-node'
import { compileODataUrl } from '@/lib/odata-compiler'
import { useProjectStore } from '@/store/project-store'
import { Focus } from 'lucide-react'

// Register our custom table node type
const nodeTypes = {
  tableNode: TableNode
}

interface ErdCanvasProps {
  projectId: string
  datasetId: string
  rootTable: string
}

const ReturnToRootButton: React.FC<{ rootTable: string }> = ({ rootTable }) => {
  const { fitView } = useReactFlow()
  
  return (
    <button
      onClick={() => {
        if (rootTable) {
          fitView({ nodes: [{ id: rootTable }], duration: 800, padding: 0.5 })
        } else {
          fitView({ duration: 800 })
        }
      }}
      className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 px-3 py-2 bg-card text-foreground border border-border shadow-lg rounded-lg text-xs font-bold hover:bg-muted transition-all active:scale-95 cursor-pointer"
      title="Return to Root Table"
    >
      <Focus className="w-3.5 h-3.5 text-primary animate-pulse" />
      <span>Center Root</span>
    </button>
  )
}

const InnerErdCanvas: React.FC<ErdCanvasProps> = ({ projectId, datasetId, rootTable }) => {
  const { 
    nodes, 
    edges, 
    selected_paths,
    onNodesChange, 
    onEdgesChange, 
    loadNeighborhood,
    loadFullSchema,
    isFallbackMode,
    expandNodeNeighborhood,
    toggleNodeSelection,
    toggleEdgeSelection,
    isLoading 
  } = useVisualQueryStore()

  // Load root table's neighborhood or full schema on mount or when table changes (only if no URL query is preset)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('q')) {
      return
    }

    if (isFallbackMode) {
      if (rootTable) {
        loadNeighborhood(projectId, datasetId, rootTable)
      }
    } else {
      loadFullSchema(projectId, datasetId)
    }
  }, [projectId, datasetId, rootTable, loadNeighborhood, loadFullSchema, isFallbackMode])

  // Hydrate workspace from URL search parameters on mount
  const hasHydratedRef = React.useRef(false)
  useEffect(() => {
    if (hasHydratedRef.current) return
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q')
    if (q) {
      try {
        const decoded = JSON.parse(atob(q))
        if (decoded.activeTable && decoded.selected_paths) {
          hasHydratedRef.current = true
          useVisualQueryStore.getState().hydrateFromUrl(
            decoded.activeTable,
            decoded.selected_paths,
            projectId,
            datasetId
          )
        }
      } catch (e) {
        console.error('Failed to hydrate visual store from URL search param:', e)
      }
    }
  }, [projectId, datasetId])

  // Pre-execution dry-run permission audit check (Story 12.4)
  const [hasAudited, setHasAudited] = useState(false)
  const { setElenaTip, openElenaDrawer } = useProjectStore()

  useEffect(() => {
    if (!isLoading && selected_paths.length > 0 && !hasAudited) {
      setHasAudited(true)
      
      const runAudit = async () => {
        const activeTable = useVisualQueryStore.getState().activeTable
        if (!activeTable) return

        const serviceRoot = `http://127.0.0.1:3005/v1/${projectId}/${datasetId}`
        const compiledUrl = compileODataUrl(serviceRoot, activeTable, selected_paths)
        const queryString = compiledUrl.includes('?') ? compiledUrl.split('?')[1] : ''

        try {
          const { dryRunQueryAction } = await import('@/app/actions/odata')
          const result = await dryRunQueryAction(projectId, datasetId, activeTable, queryString)

          if (result && !result.success && result.error?.status === 403) {
            const elenaTipDetail = result.error.details?.find((d: any) => d.code === 'ELENA_TIP')
            const elenaMessage = elenaTipDetail?.message || "Some tables from this shared query have been pruned as you do not have permission to access them. Click here to re-authorize with a clean, budget-safe subset."
            
            let unauthorizedTable = 'Billing'
            if (elenaMessage.includes('specifically ')) {
              const matches = elenaMessage.match(/specifically (\w+)/)
              if (matches && matches[1]) {
                unauthorizedTable = matches[1]
              }
            }

            // Prune the unauthorized paths
            useVisualQueryStore.getState().pruneUnauthorizedPaths(unauthorizedTable)

            // Show Elena Tips Drawer with re-authorization quick fix
            setElenaTip({
              title: "Access Restricted",
              message: elenaMessage,
              advice: "Elena advises: Ask your BigQuery IAM Administrator for bigquery.tables.getData permission on the restricted resources.",
              quick_fixes: [
                {
                  label: "Re-authorize Budget-Safe Subset",
                  action: "CLEAN_REAUTH"
                }
              ]
            })
            openElenaDrawer()
          }
        } catch (err) {
          console.error('[ErdCanvas] Pre-execution audit failed:', err)
        }
      }

      runAudit()
    }
  }, [isLoading, selected_paths, hasAudited, projectId, datasetId, setElenaTip, openElenaDrawer])

  // Debounced URL state serialization
  useEffect(() => {
    const activeTable = useVisualQueryStore.getState().activeTable
    if (selected_paths.length === 0 && !activeTable) return

    const handler = setTimeout(() => {
      const state = {
        selected_paths,
        activeTable
      }
      try {
        const base64 = btoa(JSON.stringify(state))
        const url = new URL(window.location.href)
        url.searchParams.set('q', base64)
        window.history.replaceState(null, '', url.toString())
      } catch (e) {
        console.error('Failed to serialize query state to URL:', e)
      }
    }, 400) // 400ms debounce

    return () => clearTimeout(handler)
  }, [selected_paths])

  // Style selected edges using the semantic primary CSS variable color
  const edgesWithSelection = edges.map(edge => {
    const joinKey = `${edge.source}->${edge.target}`
    const isSelected = selected_paths.includes(joinKey)
    return {
      ...edge,
      style: isSelected ? { stroke: 'var(--primary)', strokeWidth: 3 } : edge.style,
      animated: isSelected ? true : edge.animated
    }
  })

  return (
    <div 
      aria-hidden="true"
      className="relative w-full h-full border border-border rounded-xl overflow-hidden bg-muted/20 shadow-inner min-h-[500px]"
    >
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <span className="text-sm font-medium text-muted-foreground">Loading dataset schema graph...</span>
          </div>
        </div>
      )}
      
      <ReactFlow
        nodes={nodes}
        edges={edgesWithSelection}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeDoubleClick={(event, node) => {
          expandNodeNeighborhood(projectId, datasetId, node.id)
        }}
        onNodeClick={(event, node) => {
          toggleNodeSelection(node.id)
        }}
        onEdgeClick={(event, edge) => {
          toggleEdgeSelection(edge.id)
        }}
        fitView
        className="w-full h-full"
        minZoom={0.2}
        maxZoom={1.5}
      >
        <Background variant={BackgroundVariant.Lines} gap={24} size={1} className="opacity-30" />
        <Controls 
          className="bg-card border border-border text-foreground shadow-lg rounded-lg" 
          showInteractive={false} 
        />
        <MiniMap 
          className="border border-border bg-card shadow-lg rounded-lg" 
          nodeColor={(node) => {
            const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
            if (node.data?.isRoot) {
              return isDark ? '#8ab4f8' : '#1a73e8'
            }
            return isDark ? '#3c4043' : '#dadce0'
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
      <ReturnToRootButton rootTable={rootTable} />
    </div>
  )
}

export const ErdCanvas: React.FC<ErdCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <InnerErdCanvas {...props} />
    </ReactFlowProvider>
  )
}
