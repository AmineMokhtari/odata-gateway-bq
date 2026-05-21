/**
 * Unit tests for the PII Scrubber utility
 * @story 14.1 - PII-Scrubbed React Error Boundary
 */

import { describe, it, expect } from 'vitest'
import { deterministicHash, scrubPII } from '../../src/lib/pii-scrubber'
import type { Node, Edge } from '@xyflow/react'

describe('deterministicHash', () => {
  it('should produce consistent output for the same input', () => {
    const hash1 = deterministicHash('Customers')
    const hash2 = deterministicHash('Customers')
    expect(hash1).toBe(hash2)
  })

  it('should produce different output for different inputs', () => {
    const hash1 = deterministicHash('Customers')
    const hash2 = deterministicHash('Orders')
    expect(hash1).not.toBe(hash2)
  })

  it('should produce an 8-character hex string', () => {
    const hash = deterministicHash('Customers')
    expect(hash).toMatch(/^[0-9a-f]{8}$/)
  })

  it('should handle empty string', () => {
    const hash = deterministicHash('')
    expect(hash).toMatch(/^[0-9a-f]{8}$/)
  })
})

describe('scrubPII', () => {
  const mockNodes: Node[] = [
    {
      id: 'Customers',
      type: 'tableNode',
      position: { x: 100, y: 200 },
      data: {
        label: 'Customers',
        isRoot: true,
        columns: [
          { name: 'id', type: 'INTEGER', isNullable: false },
          { name: 'email', type: 'STRING', isNullable: true },
        ],
        partitionColumn: 'created_at',
        isPinned: false,
        isExpanded: true,
      },
    },
    {
      id: 'Orders',
      type: 'tableNode',
      position: { x: 400, y: 300 },
      data: {
        label: 'Orders',
        isRoot: false,
        columns: [
          { name: 'order_id', type: 'INTEGER', isNullable: false },
          { name: 'customer_id', type: 'INTEGER', isNullable: false },
        ],
        partitionColumn: null,
        isPinned: true,
        isExpanded: false,
      },
    },
  ]

  const mockEdges: Edge[] = [
    {
      id: 'Customers->Orders',
      source: 'Customers',
      target: 'Orders',
      type: 'default',
    },
  ]

  const mockSelectedPaths = [
    'Customers',
    'Customers.id',
    'Customers.email',
    'Orders',
    'Customers->Orders',
  ]

  const mockError = new Error('Failed to render node Customers')

  it('should scrub all table names from node ids and labels', () => {
    const result = scrubPII(mockNodes, mockEdges, mockSelectedPaths, mockError)

    // Node IDs should be hashes, not raw names
    expect(result.nodes[0].id).not.toBe('Customers')
    expect(result.nodes[1].id).not.toBe('Orders')

    // Labels should be hashes
    expect(result.nodes[0].data.label).not.toBe('Customers')
    expect(result.nodes[1].data.label).not.toBe('Orders')

    // Same table name should produce same hash
    expect(result.nodes[0].id).toBe(result.nodes[0].data.label)
  })

  it('should preserve coordinate data in scrubbed nodes', () => {
    const result = scrubPII(mockNodes, mockEdges, mockSelectedPaths, mockError)

    expect(result.nodes[0].position).toEqual({ x: 100, y: 200 })
    expect(result.nodes[1].position).toEqual({ x: 400, y: 300 })
  })

  it('should preserve boolean metadata flags', () => {
    const result = scrubPII(mockNodes, mockEdges, mockSelectedPaths, mockError)

    expect(result.nodes[0].data.isRoot).toBe(true)
    expect(result.nodes[0].data.isExpanded).toBe(true)
    expect(result.nodes[0].data.isPinned).toBe(false)
    expect(result.nodes[1].data.isRoot).toBe(false)
    expect(result.nodes[1].data.isPinned).toBe(true)
  })

  it('should scrub column names but preserve column types', () => {
    const result = scrubPII(mockNodes, mockEdges, mockSelectedPaths, mockError)

    const cols0 = result.nodes[0].data.columns!
    expect(cols0[0].name).not.toBe('id')
    expect(cols0[0].type).toBe('INTEGER') // Type is NOT PII
    expect(cols0[1].name).not.toBe('email')
    expect(cols0[1].type).toBe('STRING')
  })

  it('should scrub partitionColumn name', () => {
    const result = scrubPII(mockNodes, mockEdges, mockSelectedPaths, mockError)

    expect(result.nodes[0].data.partitionColumn).not.toBe('created_at')
    expect(result.nodes[0].data.partitionColumn).toMatch(/^[0-9a-f]{8}$/)
    expect(result.nodes[1].data.partitionColumn).toBeNull()
  })

  it('should scrub edge source and target identifiers', () => {
    const result = scrubPII(mockNodes, mockEdges, mockSelectedPaths, mockError)

    expect(result.edges[0].source).not.toBe('Customers')
    expect(result.edges[0].target).not.toBe('Orders')
    // Edge source should match the hashed node id for Customers
    expect(result.edges[0].source).toBe(result.nodes[0].id)
    expect(result.edges[0].target).toBe(result.nodes[1].id)
  })

  it('should preserve edge type', () => {
    const result = scrubPII(mockNodes, mockEdges, mockSelectedPaths, mockError)
    expect(result.edges[0].type).toBe('default')
  })

  it('should scrub selected_paths table and column names', () => {
    const result = scrubPII(mockNodes, mockEdges, mockSelectedPaths, mockError)

    // No raw names should appear
    for (const path of result.selectedPaths) {
      expect(path).not.toContain('Customers')
      expect(path).not.toContain('Orders')
      expect(path).not.toContain('email')
      expect(path).not.toContain('id')
    }

    // Dot-separated paths should be preserved structurally
    const dotPaths = result.selectedPaths.filter(p => p.includes('.'))
    expect(dotPaths.length).toBe(2) // Customers.id and Customers.email
  })

  it('should scrub arrow-separated join paths', () => {
    const result = scrubPII(mockNodes, mockEdges, mockSelectedPaths, mockError)

    const arrowPaths = result.selectedPaths.filter(p => p.includes('->'))
    expect(arrowPaths.length).toBe(1)
    expect(arrowPaths[0]).not.toContain('Customers')
    expect(arrowPaths[0]).not.toContain('Orders')
  })

  it('should scrub error message of known identifiers', () => {
    const result = scrubPII(mockNodes, mockEdges, mockSelectedPaths, mockError)

    expect(result.error).not.toContain('Customers')
    expect(result.error).toContain('[') // Replaced with [hash]
  })

  it('should include a valid ISO timestamp', () => {
    const result = scrubPII(mockNodes, mockEdges, mockSelectedPaths, mockError)

    expect(result.timestamp).toBeTruthy()
    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp)
  })

  it('should use consistent hashes — same identifier produces same hash everywhere', () => {
    const result = scrubPII(mockNodes, mockEdges, mockSelectedPaths, mockError)

    // The hash for "Customers" should be the same in node.id, edge.source, and paths
    const customersNodeId = result.nodes[0].id
    const edgeSource = result.edges[0].source
    const plainPaths = result.selectedPaths.filter(p => !p.includes('.') && !p.includes('->'))
    
    expect(customersNodeId).toBe(edgeSource)
    expect(plainPaths).toContain(customersNodeId)
  })

  it('should include column count per node', () => {
    const result = scrubPII(mockNodes, mockEdges, mockSelectedPaths, mockError)

    expect(result.nodes[0].data.columnCount).toBe(2)
    expect(result.nodes[1].data.columnCount).toBe(2)
  })

  it('should handle nodes with no columns gracefully', () => {
    const emptyNode: Node = {
      id: 'EmptyTable',
      type: 'tableNode',
      position: { x: 0, y: 0 },
      data: { label: 'EmptyTable' },
    }

    const result = scrubPII([emptyNode], [], [], new Error('test'))

    expect(result.nodes[0].data.columns).toEqual([])
    expect(result.nodes[0].data.columnCount).toBe(0)
  })
})
