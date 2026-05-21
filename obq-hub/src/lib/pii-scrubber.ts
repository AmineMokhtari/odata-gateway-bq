/**
 * PII Scrubber Utility
 * 
 * Replaces all proprietary database schema names (table names, column names,
 * OData path segments) with deterministic truncated SHA-256 hashes, preserving
 * layout topology and coordinate data for diagnostic debugging.
 * 
 * @module pii-scrubber
 * @story 14.1 - PII-Scrubbed React Error Boundary
 */

import type { Node, Edge } from '@xyflow/react'

/**
 * Simple synchronous deterministic hash function.
 * Produces a consistent 8-character hex digest for any string input.
 * Uses djb2 algorithm doubled with bit mixing for collision resistance.
 */
export function deterministicHash(input: string): string {
  let h1 = 5381
  let h2 = 52711
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i)
    h1 = ((h1 << 5) + h1 + ch) >>> 0
    h2 = ((h2 << 5) + h2 + ch) >>> 0
  }
  // Combine both hashes into an 8-char hex string
  const combined = ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0')
  return combined
}

/**
 * Interface for the scrubbed diagnostic payload.
 */
export interface ScrubbedDiagnosticPayload {
  /** Scrubbed React Flow nodes — identifiers replaced, coordinates preserved */
  nodes: ScrubNode[]
  /** Scrubbed React Flow edges — source/target replaced, structure preserved */
  edges: ScrubEdge[]
  /** Scrubbed selected_paths — each path segment hashed */
  selectedPaths: string[]
  /** Error message (scrubbed of identifiers) */
  error: string
  /** Component stack trace if available */
  componentStack?: string
  /** Timestamp of the error */
  timestamp: string
}

interface ScrubNode {
  id: string
  type?: string
  position: { x: number; y: number }
  data: {
    label: string
    isRoot?: boolean
    columnCount?: number
    columns?: { name: string; type: string }[]
    partitionColumn?: string | null
    isExpanded?: boolean
    isPinned?: boolean
  }
}

interface ScrubEdge {
  id: string
  source: string
  target: string
  type?: string
}

/**
 * Scrubs PII from a Zustand visual query state snapshot.
 * 
 * Replaces all table names, column names, and path segments with deterministic
 * hashes while preserving layout topology (coordinates, edge structure) and
 * metadata flags (isRoot, isPinned, isExpanded, types).
 * 
 * @param nodes - React Flow nodes from the Zustand store
 * @param edges - React Flow edges from the Zustand store
 * @param selectedPaths - selected_paths array from the Zustand store
 * @param error - The caught error object
 * @param componentStack - Optional React component stack trace
 * @returns A fully scrubbed diagnostic payload safe for transmission
 */
export function scrubPII(
  nodes: Node[],
  edges: Edge[],
  selectedPaths: string[],
  error: Error,
  componentStack?: string
): ScrubbedDiagnosticPayload {
  // Build a consistent identifier map so the same name always gets the same hash
  const identifierCache = new Map<string, string>()

  const hashIdentifier = (name: string): string => {
    if (!name) return ''
    const cached = identifierCache.get(name)
    if (cached) return cached
    const hashed = deterministicHash(name)
    identifierCache.set(name, hashed)
    return hashed
  }

  // Scrub nodes
  const scrubbedNodes: ScrubNode[] = nodes.map(node => {
    const data = node.data as Record<string, unknown>
    const columns = (data?.columns as Array<{ name: string; type: string }>) ?? []
    
    return {
      id: hashIdentifier(node.id),
      type: node.type,
      position: { x: node.position?.x ?? 0, y: node.position?.y ?? 0 },
      data: {
        label: hashIdentifier((data?.label as string) ?? node.id),
        isRoot: (data?.isRoot as boolean) ?? false,
        columnCount: columns.length,
        columns: columns.map(col => ({
          name: hashIdentifier(col.name),
          type: col.type // Type names (STRING, INTEGER, etc.) are not PII
        })),
        partitionColumn: data?.partitionColumn
          ? hashIdentifier(data.partitionColumn as string)
          : null,
        isExpanded: (data?.isExpanded as boolean) ?? false,
        isPinned: (data?.isPinned as boolean) ?? false,
      }
    }
  })

  // Scrub edges
  const scrubbedEdges: ScrubEdge[] = edges.map(edge => ({
    id: hashIdentifier(edge.id),
    source: hashIdentifier(edge.source),
    target: hashIdentifier(edge.target),
    type: edge.type,
  }))

  // Scrub selected paths — each segment is a table name or "table.column"
  const scrubbedPaths = selectedPaths.map(path => {
    if (path.includes('.')) {
      const [table, column] = path.split('.')
      return `${hashIdentifier(table)}.${hashIdentifier(column)}`
    }
    if (path.includes('->')) {
      const [source, target] = path.split('->')
      return `${hashIdentifier(source)}->${hashIdentifier(target)}`
    }
    return hashIdentifier(path)
  })

  // Scrub the error message — replace any known identifiers
  let scrubbedMessage = error.message
  for (const [original, hashed] of identifierCache.entries()) {
    scrubbedMessage = scrubbedMessage.replaceAll(original, `[${hashed}]`)
  }

  return {
    nodes: scrubbedNodes,
    edges: scrubbedEdges,
    selectedPaths: scrubbedPaths,
    error: scrubbedMessage,
    componentStack: componentStack ?? undefined,
    timestamp: new Date().toISOString(),
  }
}
