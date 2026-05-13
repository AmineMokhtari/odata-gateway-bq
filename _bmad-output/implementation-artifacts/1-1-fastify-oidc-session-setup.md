---
story_id: "1.1"
story_key: "1-1-fastify-oidc-session-setup"
title: "Fastify OIDC & Session Setup"
epic: "1: Secure Hybrid Bridge"
status: "ready-for-dev"
last_updated: "2026-05-13"
---

# Story 1.1: Fastify OIDC & Session Setup

## User Story Statement
**As a** Developer,  
**I want** Fastify to handle the OIDC login flow and issue an HttpOnly session cookie,  
**So that** identity is centrally managed in the backend and secure from client-side XSS.

## Acceptance Criteria
1. **Given** an unauthenticated request to the Fastify `/auth/login` endpoint.
2. **When** the user initiates login.
3. **Then** Fastify performs the OIDC redirect flow to the configured Provider (Entra ID/Google).
4. **And** upon callback, Fastify verifies the `id_token` using the `jose` library (JWKS verification).
5. **And** issues a secure, `HttpOnly`, `SameSite: Lax` session cookie containing the verified user claims.
6. **And** provides a `/auth/session` endpoint to return the current user's email and auth status.

## Developer Context & Guardrails

### 🏗️ Architecture Compliance
- **Hybrid BFF Model**: Fastify is now the Source of Truth for identity.
- **Strict ESM**: All backend code must use ESM imports with explicit `.js` extensions.
- **Fastify v5**: Ensure compatibility with the latest Fastify version.
- **Statelessness**: Session data must be stored in a way that supports Cloud Run (e.g., encrypted cookie session or external store). For this MVP, use `@fastify/session` with an encrypted cookie store.

### 🛠️ Technical Requirements
- **Verification**: Use `jose` (`jwtVerify`) with a `RemoteJWKSet` to verify the OIDC token. Do NOT use manual decoding.
- **Claims**: Extract `email` and `sub` from the token and store them in the `request.session`.
- **Labels**: Every authenticated request must have `request.user_email` and `request.correlation_id` decorated for downstream BigQuery logging.
- **Environment**: Use `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, and `OIDC_ISSUER` from `.env`.

### 📂 File Structure Requirements
- **Plugin**: Create `backend/src/plugins/auth.ts` for the OIDC/Session logic.
- **Routes**: Create `backend/src/routes/auth.ts` for the login/callback/session endpoints.
- **Tests**: Create `backend/test/plugins/auth.test.ts` to verify the OIDC flow mocking the provider.

### 📦 Library Requirements
- `jose`: v6.2.2 (Verification)
- `@fastify/oauth2`: (OIDC Flow)
- `@fastify/session`: (Session management)
- `@fastify/cookie`: (Cookie handling)

## Testing Requirements
- **Integration Test**: Mock the OIDC provider's JWKS endpoint and verify that a valid token results in a `Set-Cookie` header.
- **Security Check**: Verify that the issued cookie is `HttpOnly`.

## Success Criteria
- [ ] Successful redirect to IdP.
- [ ] Successful callback processing and token verification.
- [ ] Session cookie is set and readable by subsequent requests.
- [ ] `/auth/session` returns valid JSON for logged-in users.

---
**Status**: ready-for-dev  
**Analyst Note**: This is the first step in the hybrid migration. Ensure the session secret is read from environment variables and never hardcoded.
