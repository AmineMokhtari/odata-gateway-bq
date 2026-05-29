---
title: 'Frontend Auth Redirection'
type: 'feature'
created: '2026-05-29T15:15:37+02:00'
status: 'done'
baseline_commit: '44d1ae9cb1a72e7d31d57612d8317db56057dc2a'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** When OIDC authentication is enabled (`ANONYMOUS_MODE=false`), `obq-hub` currently hides the 401 error by blindly falling back to local mock data (`dev-tenants.yaml`), and there is no UI workflow to actually trigger a login. Additionally, the backend `obq-gateway`'s authentication callback redirects users to the backend root (`http://localhost:3005/`) instead of back to the Hub (`http://localhost:3000/`).

**Approach:** We will update `obq-hub` to stop falling back to mock data when `ANONYMOUS_MODE=false` and instead redirect to the backend's `/auth/login` endpoint when a 401 Unauthorized is encountered on page load. We will also update `obq-gateway`'s auth callback to redirect users back to the `obq-hub` frontend using a new `HUB_URL` environment variable. Finally, we will update the Elena Drawer to support the `REFRESH_SESSION` action by redirecting the user to login.

## Boundaries & Constraints

**Always:** Check `process.env.ANONYMOUS_MODE` in Next.js Server Actions to distinguish between development fallback mode and secure authentication mode.

**Ask First:** If the gateway URL routing requires additional NGINX or reverse proxy configurations.

**Never:** Never expose OIDC client secrets or sensitive tokens in the `obq-hub` frontend components; authentication must remain a backend concern (Trusted Subsystem).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Unauthenticated user visits catalog | `ANONYMOUS_MODE=false`, no session cookie | Server Action `getTenants` catches 401 and calls Next.js `redirect()` to gateway `/auth/login` | N/A |
| Session expires during interactive query | `ANONYMOUS_MODE=false`, expired cookie | `dryRunQueryAction` returns 401 with `REFRESH_SESSION` elena_tip. UI shows drawer. User clicks "Refresh Session" button. | N/A |

</frozen-after-approval>

## Code Map

- `obq-hub/src/app/actions/tenants.ts` -- Needs to redirect to login instead of falling back when `ANONYMOUS_MODE` is disabled.
- `obq-gateway/src/routes/auth/index.ts` -- Needs to redirect back to `HUB_URL` after successful login.
- `obq-hub/src/components/drawers/ElenaDrawer.tsx` -- Needs a handler for the `REFRESH_SESSION` action to redirect the window to login.
- `.env` & `.env.example` -- Add `HUB_URL` variable.

## Tasks & Acceptance

**Execution:**
- [x] `.env` -- Add `HUB_URL=http://127.0.0.1:$HUB_PORT` -- RATIONALE: Needed to know where to redirect after login.
- [x] `obq-gateway/src/config.ts` -- Parse `HUB_URL` -- RATIONALE: Expose it to the gateway routes.
- [x] `obq-gateway/src/routes/auth/index.ts` -- Update `targetUrl` to use `config.hubUrl` -- RATIONALE: Ensures users land back in the Hub after authenticating with Azure AD.
- [x] `obq-hub/src/app/actions/tenants.ts` -- Update `catch` block to `redirect()` to `${process.env.NEXT_PUBLIC_GATEWAY_URL}/auth/login` if `process.env.ANONYMOUS_MODE !== 'true'` -- RATIONALE: Forces login on initial page load if not authenticated.
- [x] `obq-hub/src/components/drawers/ElenaDrawer.tsx` -- Render a "Refresh Session" button if `tip.action === 'REFRESH_SESSION'` that redirects to `${process.env.NEXT_PUBLIC_GATEWAY_URL}/auth/login` -- RATIONALE: Allows recovering from expired sessions seamlessly during client-side interactions.

**Acceptance Criteria:**
- Given `ANONYMOUS_MODE=false`, when an unauthenticated user navigates to `/catalog`, then they are immediately redirected to the OIDC login page.
- Given a successful OIDC login, when the provider redirects to `/auth/callback`, then the user is redirected back to the `obq-hub` URL instead of remaining on the gateway.
- Given an expired session during a query, when the `ElenaDrawer` appears, then it contains a functional "Refresh Session" button that redirects to login.

## Verification

**Manual checks (if no CLI):**
- Configure `.env` with `ANONYMOUS_MODE=false` and provide valid Azure AD OIDC credentials.
- Navigate to `http://localhost:3000/catalog` in an incognito window.
- Verify automatic redirection to Azure AD login.
- Complete login and verify redirection back to `http://localhost:3000/catalog` or `/`.

## Suggested Review Order

**Gateway Configuration & Routing**

- Parse HUB_URL for gateway config injection
  [`config.ts:47`](../../obq-gateway/src/config.ts#L47)

- Safe redirection callback respecting returnTo
  [`auth/index.ts:38`](../../obq-gateway/src/routes/auth/index.ts#L38)

**Frontend Integration & Action Redirection**

- Enforce login redirection on unauthenticated fallback
  [`tenants.ts:40`](../../obq-hub/src/app/actions/tenants.ts#L40)

- Surface auth failures reliably rather than swallowing
  [`gateway-client.ts:101`](../../obq-hub/src/lib/gateway-client.ts#L101)

- Map gateway errors consistently into action responses
  [`odata.ts:271`](../../obq-hub/src/app/actions/odata.ts#L271)

- Elena Drawer handles dynamic redirects gracefully
  [`ElenaDrawer.tsx:90`](../../obq-hub/src/components/drawers/ElenaDrawer.tsx#L90)

**Configuration**

- Define HUB_URL correctly in templates
  [`.env.example:45`](../../.env.example#L45)
