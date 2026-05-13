---
story_id: "1.2"
story_key: "1-2-nextjs-gateway-client-initialization"
epic_id: "1"
status: "done"
last_updated: "2026-05-13"
---

# Story 1.2: Next.js Gateway Client (`lib/gateway-client.ts`)

## Story Foundation
**As a** Developer,  
**I want** a unified `gatewayClient` in Next.js that wraps the native `fetch` API,  
**So that** all backend communication is consistent, cookie-aware, and handles identity propagation automatically.

### Acceptance Criteria
- [x] **Unified Fetch Wrapper**: Create a `gatewayClient` that wraps `fetch` with pre-configured base URL and timeout.
- [x] **Cookie Propagation (SSR)**: When called from a Server Component or Server Action, the client must automatically extract cookies from `next/headers` and include them in the `Cookie` header of the request to Fastify.
- [x] **Identity Passthrough**: Ensure `x-correlation-id` and other required audit headers are propagated if available.
- [x] **Environment Integration**: Base URL must be configurable via `BACKEND_URL` environment variable (using `GATEWAY_URL`).
- [x] **Error Handling**: Implement a consistent error handling wrapper that parses OData error responses from the backend.

## Developer Context
This is a critical piece of the "Hybrid Bridge". Next.js (the BFF frontend) needs to talk to Fastify (the identity provider and data engine). Since the browser session cookie is `HttpOnly`, only the Next.js server layer can read and forward it.

### Technical Requirements
- **Runtime**: Node.js (Next.js Server Side).
- **Library**: Native `fetch` API.
- **Header Integration**: Use `cookies()` from `next/headers` (requires the client to be called within a server context).
- **Security**: Never log sensitive cookie data.

### Architecture Compliance
- **Hybrid BFF Model**: Adheres to the Transparent Cookie Proxy pattern.
- **Correlation**: Injects `x-correlation-id` if not already present.

### File Structure
- **Client**: `frontend/src/lib/gateway-client.ts`.
- **Test**: `frontend/test/lib/gateway-client.test.ts`.

## Testing Requirements
- **Mock Fetch**: Verify that `cookies()` are correctly read and injected into the request headers.
- **Base URL**: Verify that the client correctly prepends the `BACKEND_URL`.
- **Timeout**: Verify that the client respects a default timeout (e.g., 30s).

---
**Status:** ready-for-dev
