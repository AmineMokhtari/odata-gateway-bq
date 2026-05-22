# Story 14.2: Asynchronous Batched Telemetry Beacon

## Story

As an administrator,
I want visual canvas telemetry events to be queued and periodically sent in non-blocking batches via `navigator.sendBeacon` (with standard keepalive fallback),
So that we can collect rich diagnostics on visual builder exploration and system behavior under load without impacting client UI framerates or thread execution.

## Status

done

## Acceptance Criteria

- **AC1**: Zustand store state (`VisualQueryState`) extended with a thread-safe `event_queue` and a session-specific UUID identifier `sessionId`.
- **AC2**: Core store interaction methods instrumented to queue interaction metrics (e.g., `'table_expanded'`, `'query_selected'`, `'column_selected'`, `'edge_selected'`, `'node_pinned'`, `'canvas_cleared'`, `'lru_pruned'`, `'schema_drift_detected'`).
- **AC3**: The event queue uses a module-level 2-second debounce timer (`telemetryFlushTimeout`) to batch-dispatch events in a single fire-and-forget payload.
- **AC4**: Flush transmission uses `navigator.sendBeacon` as the primary non-blocking transport channel and gracefully falls back to a custom `fetch` (`keepalive: true`) wrapper if unavailable.
- **AC5**: Window lifecycle listeners are registered in the browser for both `visibilitychange` (state is `hidden`) and `pagehide` to automatically flush remaining events during tab closures or navigation.
- **AC6**: Fastify backend implements a lightweight POST route at `/v1/telemetry` which:
  - Bypasses OIDC authentication checks (so background telemetry beacons are never blocked by expired/absent session cookies).
  - Responds immediately with `204 No Content` to release the client connection without blocking.
  - Logs the event batch asynchronously using a dedicated Pino child logger stream containing `stream: 'telemetry'`, `sessionId`, and `clientVersion`.

## Implementation Details

### Frontend Telemetry Store Extension

We extended `obq-hub/src/store/visual-query.ts` to include:
- `event_queue: TelemetryEvent[]` - Client event queue.
- `sessionId: string` - Randomized session ID generated uniquely per page lifecycle.
- `enqueueEvent(type, metadata)` - Pushes telemetry events to the queue and triggers a debounced flush.
- `flushTelemetry()` - Safely pulls all enqueued events, clears state immediately, resolves the endpoint, and calls `sendTelemetryBatch()`.

#### Window Lifecycle Event Listeners
We attached automatic browser hooks to ensure no events are lost during tab closures:
```typescript
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      useVisualQueryStore.getState().flushTelemetry()
    }
  })
  window.addEventListener('pagehide', () => {
    useVisualQueryStore.getState().flushTelemetry()
  })
}
```

### Backend Telemetry Route & Async Processing

We added a dedicated POST route at `/v1/telemetry` in `obq-gateway/src/routes/v1/index.ts`:
- Returns `reply.code(204).send()` immediately.
- Leverages Node's `setImmediate()` event loop schedule to parse the batch asynchronously:
```typescript
  fastify.post('/telemetry', async function (request, reply) {
    reply.code(204).send()

    const body = request.body as any
    if (body && Array.isArray(body.events)) {
      const logger = fastify.log.child({ 
        stream: 'telemetry', 
        sessionId: body.sessionId, 
        clientVersion: body.clientVersion 
      })
      setImmediate(() => {
        for (const event of body.events) {
          logger.info({ event }, 'Telemetry event recorded')
        }
      })
    }

    return reply
  })
```

### Authentication Bypass for Diagnostics Reliability

We exempted the telemetry route from OIDC session gate verification in `obq-gateway/src/plugins/auth.ts`:
```typescript
    const routePattern = request.routeOptions.url
    if (
      routePattern === '/health' || 
      routePattern?.startsWith('/health/') || 
      routePattern?.startsWith('/auth/') ||
      routePattern === '/v1/telemetry' ||
      routePattern?.startsWith('/v1/telemetry')
    ) {
      return
    }
```

---

## Verification Plan

### 1. Automated Unit Tests

Created 5 unit tests in `obq-hub/tests/unit/telemetry-beacon.test.ts` covering:
- **Event Creation**: Verified `createTelemetryEvent` sets correct types, timestamps, and metadata.
- **Navigator Beacon**: Verified `sendTelemetryBatch` utilizes `navigator.sendBeacon` if available.
- **Fetch Fallback**: Verified `sendTelemetryBatch` falls back to `fetch` with `keepalive: true` in non-browser environments.
- **Zustand Debounce Integration**: Verified that `enqueueEvent` buffers events and debounces the flush by 2000ms.
- **Zustand Flush Clearing**: Verified that `flushTelemetry` resets the queue immediately to prevent double-transmission.

**Test Run Results:**
```bash
 ✓ tests/unit/telemetry-beacon.test.ts (5 tests) 57ms
   ✓ Telemetry Beacon Utility (3)
     ✓ createTelemetryEvent should create a valid event with current timestamp 10ms
     ✓ sendTelemetryBatch should use navigator.sendBeacon when available 4ms
     ✓ sendTelemetryBatch should fallback to fetch with keepalive when sendBeacon is not available 3ms
   ✓ Zustand Telemetry Store Integration (2)
     ✓ enqueueEvent should append event to event_queue and debounce flush 34ms
     ✓ flushTelemetry should empty the queue and send batch 2ms
```

### 2. Fastify API Integration Test

Created a route integration test at `obq-gateway/test/routes/telemetry.test.ts` verifying that `/v1/telemetry` responds with `204 No Content` and records the logs asynchronously in the background.

**Test Run Results:**
```bash
[18:27:22 UTC] INFO: incoming request
    req: { "method": "POST", "url": "/v1/telemetry" }
✔ telemetry endpoint responds 204 and processes asynchronously (2571.726694ms)
[18:27:22 UTC] INFO: Telemetry event recorded
    stream: "telemetry"
    sessionId: "test-session-id"
    clientVersion: "1.0.0"
    event: {
      "type": "table_expanded",
      "timestamp": 1779388042210,
      "metadata": { "nodeId": "Customers" }
    }
```

---

## File Changes Summary

### New Files
- `obq-hub/tests/unit/telemetry-beacon.test.ts` — Comprehensive unit test suite for the telemetry transport layer and state store integration.
- `obq-hub/vitest.config.ts` — High-performance, dependency-free local Vitest configuration supporting path alias resolutions (`@/`).
- `obq-gateway/test/routes/telemetry.test.ts` — Fastify endpoint integration test verifying the response code and logging payload formats.

### Modified Files
- `obq-hub/src/store/visual-query.ts` — Added telemetry event queue, sessionId, queueing actions, debounced flush, window event listeners, and detailed event logging inside canvas handlers.
- `obq-gateway/src/routes/v1/index.ts` — Registered non-blocking Fastify `/telemetry` endpoint using pino logger child streams.
- `obq-gateway/src/plugins/auth.ts` — Exempted telemetry endpoints from OIDC gates to guarantee fire-and-forget background reliability under all session lifecycles.
