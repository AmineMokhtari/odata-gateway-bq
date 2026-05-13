---
story_id: "1.3"
story_key: "1-3-transparent-cookie-proxy-implementation"
epic_id: "1"
status: "done"
last_updated: "2026-05-13"
---

# Story 1.3: Transparent Cookie Proxy Implementation

## Story Foundation
**As a** Security Architect,  
**I want** Next.js to act as a transparent proxy for session cookies,  
**So that** the browser never sees the raw OIDC tokens and the identity remains server-bound.

### Acceptance Criteria
- [x] **Secure Data Fetching**: Implement a Server Action or Server Component that uses `gatewayClient` to fetch protected data.
- [x] **Identity Verification**: Verify that the backend correctly identifies the user when the request is proxied through Next.js.
- [x] **Error Propagation**: Ensure that 401/403 errors from the backend are gracefully handled by Next.js.
- [x] **No Token Leakage**: Confirm that no sensitive OIDC tokens or session secrets are exposed to the client-side bundle or browser logs.

## Developer Context
This story validates the "Hybrid Bridge" security model. It connects the `gatewayClient` (Story 1.2) to the actual UI data flow.

### Technical Requirements
- **Integration Point**: `frontend/src/app/(dashboard)/projects/page.tsx` or similar.
- **Backend Endpoint**: `/v1/catalog` or `/v1/auth/me`.
- **Handling**: Use Next.js `redirect()` for auth failures.

## Testing Requirements
- **Integration Test**: Use Playwright to simulate an authenticated session and verify that the dashboard correctly renders data fetched from the backend.
- **Security Check**: Inspect browser network traffic to ensure only the `session` cookie is present, and no bearer tokens are visible.

---
**Status:** ready-for-dev
