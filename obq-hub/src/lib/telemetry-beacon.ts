/**
 * Telemetry Beacon Utility
 *
 * Fire-and-forget batch telemetry transmission using `navigator.sendBeacon`.
 * Falls back to `fetch` with `keepalive: true` when `sendBeacon` is unavailable
 * (e.g., certain SSR environments or test runners).
 *
 * This ensures telemetry events are transmitted even when the user closes the
 * tab immediately, without blocking client rendering framerates.
 *
 * @module telemetry-beacon
 * @story 14.2 - Asynchronous Batched Telemetry Beacon
 */

export type TelemetryEventType =
  | 'table_expanded'
  | 'query_selected'
  | 'column_selected'
  | 'edge_selected'
  | 'lru_pruned'
  | 'canvas_cleared'
  | 'node_pinned'
  | 'schema_drift_detected'
  | 'neighborhood_expanded'

export interface TelemetryEvent {
  /** The type of interaction that triggered this event */
  type: TelemetryEventType
  /** Millisecond UTC timestamp when the event occurred */
  timestamp: number
  /** Optional structured metadata for the event (must be PII-free) */
  metadata?: Record<string, string | number | boolean>
}

export interface TelemetryBatch {
  /** Array of queued events to transmit */
  events: TelemetryEvent[]
  /** SDK/client version for server-side schema versioning */
  clientVersion: string
  /** Page session identifier (tab lifecycle) */
  sessionId: string
}

/**
 * Transmits a batch of telemetry events to the Fastify `/v1/telemetry` endpoint.
 *
 * Uses `navigator.sendBeacon` as the primary transport (non-blocking, survives tab close).
 * Falls back to `fetch` with `keepalive: true` if `sendBeacon` is unavailable.
 *
 * @param endpoint - The full URL for the telemetry endpoint
 * @param batch - The batch payload to transmit
 * @returns `true` if dispatched successfully, `false` otherwise
 */
export function sendTelemetryBatch(endpoint: string, batch: TelemetryBatch): boolean {
  const payload = JSON.stringify(batch)
  const blob = new Blob([payload], { type: 'application/json' })

  // Primary path: sendBeacon (non-blocking, survives tab close)
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    try {
      const sent = navigator.sendBeacon(endpoint, blob)
      return sent
    } catch {
      // Fall through to fetch fallback
    }
  }

  // Fallback: fetch with keepalive (blocks slightly longer but more compatible)
  if (typeof fetch !== 'undefined') {
    try {
      fetch(endpoint, {
        method: 'POST',
        body: payload,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(() => {
        // Deliberately silenced — telemetry failures must never surface to users
      })
      return true
    } catch {
      return false
    }
  }

  return false
}

/**
 * Creates a new TelemetryEvent with the current timestamp.
 */
export function createTelemetryEvent(
  type: TelemetryEventType,
  metadata?: Record<string, string | number | boolean>
): TelemetryEvent {
  return {
    type,
    timestamp: Date.now(),
    metadata,
  }
}
