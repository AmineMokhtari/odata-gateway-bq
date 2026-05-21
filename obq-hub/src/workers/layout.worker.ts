// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import dagre from 'dagre'

interface LayoutMessageData {
  nodes: any[]
  edges: any[]
}

self.onmessage = (event: MessageEvent<LayoutMessageData>) => {
  const { nodes, edges } = event.data

  if (!nodes || nodes.length === 0) {
    self.postMessage({ nodes: [], edges: [] })
    return
  }

  // Create a new dagre graph
  const g = new dagre.graphlib.Graph()
  g.setGraph({
    rankdir: 'LR', // Left-to-Right layout is highly readable for schemas
    nodesep: 80,
    edgesep: 50,
    ranksep: 120,
    marginx: 40,
    marginy: 40
  })
  
  g.setDefaultEdgeLabel(() => ({}))

  // Add nodes to the dagre graph
  nodes.forEach((node) => {
    // Standard node dimensions for compact MD3 design
    const width = 280
    const columnsCount = node.data?.columns?.length || 0
    const height = 80 + Math.min(columnsCount * 30, 200)

    g.setNode(node.id, { width, height })
  })

  // Add edges to the dagre graph
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  // Execute the layout algorithm
  dagre.layout(g)

  // Extract computed coordinates back to the nodes list
  const layoutedNodes = nodes.map((node) => {
    const dagreNode = g.node(node.id)
    if (!dagreNode) return node

    return {
      ...node,
      position: {
        // Center alignment translation from dagre center coordinates
        x: dagreNode.x - dagreNode.width / 2,
        y: dagreNode.y - dagreNode.height / 2
      }
    }
  })

  // Post the positioned nodes back to the main thread
  self.postMessage({ nodes: layoutedNodes, edges })
}
