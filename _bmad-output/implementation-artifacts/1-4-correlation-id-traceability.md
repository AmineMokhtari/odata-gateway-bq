---
story_id: "1.4"
story_key: "1-4-correlation-id-traceability"
epic_id: "1"
status: "done"
last_updated: "2026-05-13"
---

# Story 1.4: Correlation ID Traceability

## Story Foundation
**As a** Cloud Admin,  
**I want** a consistent `x-correlation-id` to be passed from the browser to Next.js and then to Fastify,  
**So that** I can trace any request across both service logs for debugging and auditing.

### Acceptance Criteria
- [x] **Next.js Middleware**: Implement middleware in Next.js to ensure every incoming request has an `x-correlation-id` (generate if missing).
- [x] **Client Propagation**: Ensure `gatewayClient` pulls the correlation ID from the current request headers and forwards it to Fastify.
- [x] **Backend Logging**: Fastify receives and logs the same `x-correlation-id` via `requestIdHeader: 'x-correlation-id'` config.
- [x] **Audit Integration**: Correlation ID is captured in BigQuery audit logs via `usageTracker` and `bq-executor` labels.

## Developer Context
We already have partial support in `gatewayClient` (it pulls from `headers()`). This story formalizes the end-to-end flow.

### Technical Requirements
- **Next.js Middleware**: `frontend/src/middleware.ts`.
- **Backend Logging**: Already handled by Fastify `reqId`, but we need to ensure it's mapped to `x-correlation-id`.

## Testing Requirements
- **Integration Test**: Perform a request to a Next.js page, capture the `x-correlation-id` from the response, and then check the backend logs/audit to find the matching entry.

---
**Status:** ready-for-dev
