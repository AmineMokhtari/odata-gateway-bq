---
story_id: "1.1"
story_key: "1-1-fastify-oidc-session-setup"
title: "Fastify OIDC & Session Setup"
epic: "1: Secure Hybrid Bridge"
status: "done"
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

## Tasks / Subtasks
- [x] **Task 1: Dependency Management**
    - [x] Install `@fastify/oauth2`, `@fastify/session`, `@fastify/cookie`, and `jose`.
    - [x] Ensure types are installed for all libraries.
- [x] **Task 2: Identity Plugin (`backend/src/plugins/auth.ts`)**
    - [x] Register `@fastify/cookie` and `@fastify/session`.
    - [x] Configure OIDC strategy using `@fastify/oauth2`.
    - [x] Implement `verifyToken` utility using `jose.jwtVerify` with `RemoteJWKSet`.
    - [x] Create a `request.authenticate` decorator to verify sessions.
- [x] **Task 3: Auth Routes (`backend/src/routes/auth.ts`)**
    - [x] Implement `GET /auth/login` (OIDC Redirect).
    - [x] Implement `GET /auth/callback` (Token Exchange + Session Creation).
    - [x] Implement `GET /auth/session` (Status Check).
    - [x] Implement `POST /auth/logout` (Session Destruction).
- [x] **Task 4: Integration & Labels**
    - [x] Register the auth plugin and routes in `backend/src/app.ts`.
    - [x] Add a global `preHandler` to decorate `request.user_email` and `request.correlation_id`.
- [x] **Task 5: Testing & Validation**
    - [x] Create integration tests for the auth flow.
    - [x] Verify `HttpOnly` and `SameSite` flags on cookies.

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
- [x] Successful redirect to IdP.
- [x] Successful callback processing and token verification.
- [x] Session cookie is set and readable by subsequent requests.
- [x] `/auth/session` returns valid JSON for logged-in users.

---
**Status**: done  
**Analyst Note**: This is the first step in the hybrid migration. Ensure the session secret is read from environment variables and never hardcoded.

### Review Findings

1. **decision-needed** findings:
   - [x] [Review][Decision] Token Refresh Implementation — Resolved (Option B: Silent refresh readiness implemented).
   - [x] [Review][Decision] SameSite Cookie Strategy — Resolved (Option B: Strict implemented).

2. **patch** findings:
   - [x] [Review][Patch] Hardcoded Redirect URL [backend/src/plugins/auth.ts:77] — Fixed (Dynamic URI).
   - [x] [Review][Patch] Statelessness Violation (Memory Leak) [backend/src/plugins/auth.ts:50] — Fixed (Migrated to `@fastify/secure-session`).
   - [x] [Review][Patch] Data Leakage in /auth/session [backend/src/routes/auth/index.ts:31] — Fixed (Filtered claims).
   - [x] [Review][Patch] Naming Inconsistency [backend/src/plugins/01-labels.ts:11] — Fixed (`user_email`).
   - [x] [Review][Patch] Session Secret Validation [backend/src/plugins/auth.ts:40] — Fixed (Length check added).
   - [x] [Review][Patch] BigQuery Label Sanitization [backend/src/plugins/01-labels.ts:12] — Fixed (Sanitization regex added).
   - [x] [Review][Patch] JWKS Rotation Handling [backend/src/plugins/auth.ts] — Fixed (Handled by `jose` library defaults).
   - [x] [Review][Patch] Missing Logout Test [backend/test/plugins/auth-session.test.ts] — Fixed (Test added).

3. **defer** findings:
   - [x] [Review][Defer] Anonymous Mode Header Spoofing — deferred, pre-existing (assumed handled by infrastructure gateway).
