import { test } from 'node:test'
import * as assert from 'node:assert'
import { fetchNeighborhoodAction, getDatasetMetricsAction, getDatasetSchema } from '../../src/app/actions/schema.js'
import { useVisualQueryStore } from '../../src/store/visual-query.js'

test('fetchNeighborhoodAction Server Action', async () => {
  const originalFetch = globalThis.fetch

  globalThis.fetch = (async (url: string) => {
    assert.ok(url.includes('/neighborhood?table=Customers'))
    return {
      ok: true,
      json: async () => ({
        table: 'Customers',
        columns: [{ name: 'id', type: 'INT64' }],
        relationships: []
      })
    }
  }) as any

  const res = await fetchNeighborhoodAction('my-project', 'my_dataset', 'Customers')
  assert.ok(res)
  assert.strictEqual(res.table, 'Customers')

  globalThis.fetch = originalFetch
})

test('useVisualQueryStore: should load neighborhood and layout elements', async () => {
  const originalFetch = globalThis.fetch

  globalThis.fetch = (async () => {
    return {
      ok: true,
      json: async () => ({
        table: 'Customers',
        columns: [{ name: 'id', type: 'INT64' }],
        relationships: [
          {
            name: 'FK_Customers_Policies',
            column: 'id',
            referencedTable: 'Policies',
            referencedColumn: 'customer_id',
            type: 'TO_MANY'
          }
        ]
      })
    }
  }) as any

  const store = useVisualQueryStore.getState()
  await store.loadNeighborhood('my-project', 'my_dataset', 'Customers')

  const updatedNodes = useVisualQueryStore.getState().nodes
  const updatedEdges = useVisualQueryStore.getState().edges

  assert.strictEqual(updatedNodes.length, 2) // Customers + Policies
  assert.strictEqual(updatedEdges.length, 1) // FK_Customers_Policies
  assert.strictEqual(updatedNodes[0].id, 'Customers')
  assert.strictEqual(updatedNodes[0].data.isRoot, true)
  assert.strictEqual(updatedNodes[1].id, 'Policies')
  assert.strictEqual(updatedNodes[1].data.isRoot, false)

  globalThis.fetch = originalFetch
})

test('useVisualQueryStore: should execute triggerAsyncLayout under simulated browser', async () => {
  const originalWindow = (globalThis as any).window
  const originalWorker = (globalThis as any).Worker

  // Mock global window
  ;(globalThis as any).window = {}

  // Mock Worker
  let postedMessage: any = null
  let terminated = false

  class MockWorker {
    onmessage: ((event: any) => void) | null = null
    constructor(url: any) {
      assert.ok(url)
    }
    postMessage(data: any) {
      postedMessage = data
      // Simulate asynchronous completion by worker
      setTimeout(() => {
        if (this.onmessage) {
          this.onmessage({
            data: {
              nodes: data.nodes.map((n: any) => ({ ...n, position: { x: 100, y: 150 } })),
              edges: data.edges
            }
          })
        }
      }, 0)
    }
    terminate() {
      terminated = true
    }
  }

  ;(globalThis as any).Worker = MockWorker

  const store = useVisualQueryStore.getState()
  const initialNodes = [{ id: 'Customers', position: { x: 0, y: 0 }, data: {} }] as any[]
  const initialEdges: any[] = []

  store.setNodes(initialNodes)
  store.triggerAsyncLayout(initialNodes, initialEdges)

  // Wait for mock async worker to complete
  await new Promise((resolve) => setTimeout(resolve, 10))

  const finalNodes = useVisualQueryStore.getState().nodes
  assert.strictEqual(finalNodes[0].position.x, 100)
  assert.strictEqual(finalNodes[0].position.y, 150)
  assert.ok(terminated)

  // Restore globals
  if (originalWindow === undefined) {
    delete (globalThis as any).window
  } else {
    ;(globalThis as any).window = originalWindow
  }

  if (originalWorker === undefined) {
    delete (globalThis as any).Worker
  } else {
    ;(globalThis as any).Worker = originalWorker
  }
})

test('useVisualQueryStore: toggleNodePin locking coordinates', async () => {
  const store = useVisualQueryStore.getState()
  
  const initialNodes = [
    { id: 'Customers', position: { x: 50, y: 50 }, data: { isPinned: false } },
    { id: 'Orders', position: { x: 200, y: 200 }, data: { isPinned: false } }
  ] as any[]
  
  store.setNodes(initialNodes)
  
  store.toggleNodePin('Customers')
  
  const nodesAfterPin = useVisualQueryStore.getState().nodes
  assert.strictEqual(nodesAfterPin[0].data.isPinned, true)
  assert.strictEqual(nodesAfterPin[1].data.isPinned, false)

  const originalWindow = (globalThis as any).window
  const originalWorker = (globalThis as any).Worker
  ;(globalThis as any).window = {}
  
  class MockWorker {
    onmessage: ((event: any) => void) | null = null
    postMessage(data: any) {
      setTimeout(() => {
        if (this.onmessage) {
          this.onmessage({
            data: {
              nodes: [
                { id: 'Customers', position: { x: 999, y: 999 } },
                { id: 'Orders', position: { x: 500, y: 500 } }
              ],
              edges: []
            }
          })
        }
      }, 0)
    }
    terminate() {}
  }
  ;(globalThis as any).Worker = MockWorker

  store.triggerAsyncLayout(nodesAfterPin, [])
  await new Promise((resolve) => setTimeout(resolve, 10))

  const finalNodes = useVisualQueryStore.getState().nodes
  assert.strictEqual(finalNodes[0].position.x, 50)
  assert.strictEqual(finalNodes[0].position.y, 50)
  assert.strictEqual(finalNodes[1].position.x, 500)
  assert.strictEqual(finalNodes[1].position.y, 500)

  if (originalWindow === undefined) {
    delete (globalThis as any).window
  } else {
    ;(globalThis as any).window = originalWindow
  }
  if (originalWorker === undefined) {
    delete (globalThis as any).Worker
  } else {
    ;(globalThis as any).Worker = originalWorker
  }
})

test('useVisualQueryStore: expandNodeNeighborhood action', async () => {
  const originalFetch = globalThis.fetch
  
  globalThis.fetch = (async (url: string) => {
    assert.ok(url.includes('/neighborhood?table=Orders'))
    return {
      ok: true,
      json: async () => ({
        table: 'Orders',
        columns: [{ name: 'order_id', type: 'INT64' }],
        relationships: [
          {
            name: 'FK_Orders_Shippers',
            column: 'shipper_id',
            referencedTable: 'Shippers',
            referencedColumn: 'id',
            type: 'TO_ONE'
          }
        ]
      })
    }
  }) as any

  const store = useVisualQueryStore.getState()
  const initialNodes = [
    { id: 'Customers', position: { x: 0, y: 0 }, data: { isExpanded: true } },
    { id: 'Orders', position: { x: 100, y: 100 }, data: { isExpanded: false, columns: [] } }
  ] as any[]
  
  store.setNodes(initialNodes)
  store.setEdges([])

  await store.expandNodeNeighborhood('my-project', 'my_dataset', 'Orders')

  const updatedNodes = useVisualQueryStore.getState().nodes
  const updatedEdges = useVisualQueryStore.getState().edges

  const ordersNode = updatedNodes.find(n => n.id === 'Orders')
  assert.ok(ordersNode)
  assert.strictEqual((ordersNode.data as any).isExpanded, true)
  assert.strictEqual((ordersNode.data as any).columns.length, 1)

  const shippersNode = updatedNodes.find(n => n.id === 'Shippers')
  assert.ok(shippersNode)
  assert.strictEqual(shippersNode.data.isRoot, false)

  assert.strictEqual(updatedEdges.length, 1)
  assert.strictEqual(updatedEdges[0].id, 'FK_Orders_Shippers')

  globalThis.fetch = originalFetch
})

test('useVisualQueryStore: toggleNodeSelection and toggleEdgeSelection with selection guards', () => {
  const store = useVisualQueryStore.getState()
  store.clearCanvas()
  
  // Pre-populate edges list so edge selection can look it up
  store.setEdges([
    { id: 'Customers->Policies', source: 'Customers', target: 'Policies' }
  ] as any[])
  
  // Select Customer table
  store.toggleNodeSelection('Customers')
  assert.deepStrictEqual(useVisualQueryStore.getState().selected_paths, ['Customers'])
  
  // Edge selection guard: both source and target must be selected
  // Selecting Customers->Policies should fail because Policies is not selected
  store.toggleEdgeSelection('Customers->Policies')
  assert.deepStrictEqual(useVisualQueryStore.getState().selected_paths, ['Customers'])
  
  // Select Policies table
  store.toggleNodeSelection('Policies')
  assert.deepStrictEqual(useVisualQueryStore.getState().selected_paths, ['Customers', 'Policies'])
  
  // Selecting Customers->Policies should succeed now
  store.toggleEdgeSelection('Customers->Policies')
  assert.deepStrictEqual(useVisualQueryStore.getState().selected_paths, ['Customers', 'Policies', 'Customers->Policies'])
})

test('useVisualQueryStore: toggleColumnSelection', () => {
  const store = useVisualQueryStore.getState()
  store.clearCanvas()
  
  // Toggle Customers table column selection
  store.toggleColumnSelection('Customers', 'id')
  assert.deepStrictEqual(useVisualQueryStore.getState().selected_paths, ['Customers', 'Customers.id'])
  
  // Toggle again should remove it
  store.toggleColumnSelection('Customers', 'id')
  assert.deepStrictEqual(useVisualQueryStore.getState().selected_paths, ['Customers'])
})

test('useVisualQueryStore: applyLRUPruning preserving selected nodes', () => {
  const store = useVisualQueryStore.getState()
  store.clearCanvas()
  
  // Setup 205 nodes, with Table_2 selected
  const nodes: any[] = []
  for (let i = 1; i <= 205; i++) {
    nodes.push({
      id: `Table_${i}`,
      position: { x: 0, y: 0 },
      data: {
        lastAccessed: i,
        isRoot: i === 1
      }
    })
  }
  
  store.setNodes(nodes)
  store.setActiveTable('Table_1')
  store.toggleNodeSelection('Table_2') // selected
  
  // Call internal pruning logic passing empty edges array
  const state = useVisualQueryStore.getState()
  const { prunedNodes } = (state as any).applyLRUPruning(nodes, [])
  
  assert.ok(prunedNodes.length <= 200)
  assert.ok(prunedNodes.some((n: any) => n.id === 'Table_1')) // root
  assert.ok(prunedNodes.some((n: any) => n.id === 'Table_2')) // selected
  assert.ok(!prunedNodes.some((n: any) => n.id === 'Table_3')) // oldest is pruned
})

test('compileODataUrl: recursive query builder handles selection trees', () => {
  const { compileODataUrl } = require('../../src/lib/odata-compiler.js')
  
  const serviceRoot = 'https://gateway.example.com/v1/proj/dataset'
  const rootTable = 'Customers'
  const selectedPaths = [
    'Customers',
    'Customers.id',
    'Customers.name',
    'Policies',
    'Policies.policy_number',
    'Customers->Policies'
  ]
  
  const url = compileODataUrl(serviceRoot, rootTable, selectedPaths)
  assert.strictEqual(
    url,
    'https://gateway.example.com/v1/proj/dataset/Customers?$select=id,name&$expand=Policies($select=policy_number)'
  )
})

test('getDatasetMetricsAction and loadDatasetMetrics threshold logic', async () => {
  const originalFetch = globalThis.fetch

  // 1. Mock fetch for schema below threshold
  globalThis.fetch = (async (url: string) => {
    return {
      ok: true,
      json: async () => ({
        tables: [
          {
            name: 'Customers',
            relationships: [{ name: 'FK_1', referencedTable: 'Policies' }]
          },
          {
            name: 'Policies',
            relationships: []
          }
        ]
      })
    }
  }) as any

  const metrics = await getDatasetMetricsAction('my-project', 'my_dataset')
  assert.ok(metrics)
  assert.strictEqual(metrics.tableCount, 2)
  assert.strictEqual(metrics.relationshipCount, 1)

  const store = useVisualQueryStore.getState()
  await store.loadDatasetMetrics('my-project', 'my_dataset')
  assert.strictEqual(useVisualQueryStore.getState().isFallbackMode, false)
  assert.strictEqual(useVisualQueryStore.getState().metricsStatus, 'success')

  // 2. Mock fetch for schema above threshold (50 tables)
  globalThis.fetch = (async (url: string) => {
    const tables: any[] = []
    for (let i = 1; i <= 55; i++) {
      tables.push({
        name: `Table_${i}`,
        relationships: []
      })
    }
    return {
      ok: true,
      json: async () => ({ tables })
    }
  }) as any

  await store.loadDatasetMetrics('my-project', 'my_dataset')
  assert.strictEqual(useVisualQueryStore.getState().isFallbackMode, true)
  assert.strictEqual(useVisualQueryStore.getState().metricsStatus, 'success')

  globalThis.fetch = originalFetch
})

test('useVisualQueryStore: loadFullSchema', async () => {
  const originalFetch = globalThis.fetch

  globalThis.fetch = (async () => {
    return {
      ok: true,
      json: async () => ({
        tables: [
          {
            name: 'Customers',
            columns: [{ name: 'id', type: 'INT64' }],
            relationships: [
              {
                name: 'FK_Customers_Policies',
                column: 'id',
                referencedTable: 'Policies',
                referencedColumn: 'customer_id',
                type: 'TO_MANY'
              }
            ]
          },
          {
            name: 'Policies',
            columns: [{ name: 'customer_id', type: 'INT64' }],
            relationships: []
          }
        ]
      })
    }
  }) as any

  const store = useVisualQueryStore.getState()
  store.clearCanvas()
  await store.loadFullSchema('my-project', 'my-dataset')

  const nodes = useVisualQueryStore.getState().nodes
  const edges = useVisualQueryStore.getState().edges

  assert.strictEqual(nodes.length, 2)
  assert.strictEqual(edges.length, 1)
  assert.ok(nodes.some(n => n.id === 'Customers'))
  assert.ok(nodes.some(n => n.id === 'Policies'))
  assert.strictEqual(edges[0].id, 'FK_Customers_Policies')

  globalThis.fetch = originalFetch
})

test('useVisualQueryStore: schema drift hash mismatch clears canvas and notifies', async () => {
  const originalFetch = globalThis.fetch
  const store = useVisualQueryStore.getState()
  
  // 1. Initial state setup: set nodes, activeTable, and seed schemaVersion: 'version-A'
  store.clearCanvas()
  store.setNodes([{ id: 'Customers', position: { x: 0, y: 0 }, data: {} }] as any[])
  store.setActiveTable('Customers')
  useVisualQueryStore.setState({ schemaVersion: 'version-A' })

  // Verify initial seeded state
  assert.strictEqual(useVisualQueryStore.getState().nodes.length, 1)
  assert.strictEqual(useVisualQueryStore.getState().activeTable, 'Customers')
  assert.strictEqual(useVisualQueryStore.getState().schemaVersion, 'version-A')

  // 2. Mock fetch to return a different schema_version: 'version-B'
  globalThis.fetch = (async () => {
    return {
      ok: true,
      json: async () => ({
        table: 'Customers',
        columns: [{ name: 'id', type: 'INT64' }],
        relationships: [],
        schemaVersion: 'version-B'
      })
    }
  }) as any

  // 3. Trigger loadNeighborhood. Because of version mismatch (version-A !== version-B):
  // - canvas should be cleared (nodes, edges, activeTable cleared)
  // - new schemaVersion 'version-B' is set
  await store.loadNeighborhood('my-project', 'my_dataset', 'Customers')

  assert.strictEqual(useVisualQueryStore.getState().nodes.length, 0)
  assert.strictEqual(useVisualQueryStore.getState().activeTable, null)
  assert.strictEqual(useVisualQueryStore.getState().schemaVersion, 'version-B')

  globalThis.fetch = originalFetch
})

test('useVisualQueryStore: pruneUnauthorizedPaths correctly prunes and cleans paths', () => {
  const store = useVisualQueryStore.getState()
  store.clearCanvas()

  // Set up visual query state with nodes, edges, activeTable, and selected_paths
  useVisualQueryStore.setState({
    activeTable: 'Customers',
    nodes: [
      { id: 'Customers', type: 'tableNode', position: { x: 0, y: 0 }, data: {} },
      { id: 'Billing', type: 'tableNode', position: { x: 100, y: 100 }, data: {} },
      { id: 'Policies', type: 'tableNode', position: { x: 200, y: 200 }, data: {} }
    ] as any[],
    edges: [
      { id: 'edge1', source: 'Customers', target: 'Billing' },
      { id: 'edge2', source: 'Customers', target: 'Policies' }
    ] as any[],
    selected_paths: [
      'Customers.id',
      'Customers.name',
      'Customers->Billing',
      'Billing',
      'Billing.id',
      'Billing.amount',
      'Customers->Policies',
      'Policies',
      'Policies.id'
    ]
  })

  // Prune 'Billing' from paths
  store.pruneUnauthorizedPaths('Billing')

  const nextState = useVisualQueryStore.getState()

  // Verify paths are pruned
  assert.deepStrictEqual(nextState.selected_paths, [
    'Customers.id',
    'Customers.name',
    'Customers->Policies',
    'Policies',
    'Policies.id'
  ])

  // Verify nodes and edges are updated
  assert.strictEqual(nextState.nodes.length, 2)
  assert.ok(nextState.nodes.some(n => n.id === 'Customers'))
  assert.ok(nextState.nodes.some(n => n.id === 'Policies'))
  assert.ok(!nextState.nodes.some(n => n.id === 'Billing'))

  assert.strictEqual(nextState.edges.length, 1)
  assert.strictEqual(nextState.edges[0].target, 'Policies')
})



