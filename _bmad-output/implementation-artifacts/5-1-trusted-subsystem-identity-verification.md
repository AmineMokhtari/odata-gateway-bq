# Story 5.1: Trusted Subsystem Identity Verification

Status: done

## Story

As a System,
I want to verify identities in Trusted Subsystem mode,
so that I can authorize against internal rules.

## Acceptance Criteria

1. **Given** a verified OIDC JWT payload, **When** processed by the authentication plugin, **Then** the System extracts the user's primary email address (e.g., from `email`, `upn`, or `preferred_username` claims).
2. **And** the System extracts the user's group memberships (e.g., from `groups` or `roles` claims).
3. **And** these attributes are attached to `request.user` for use by the internal rule engine.
4. **And** the verification is performed strictly without requiring GCP IAM synchronization.

## Tasks / Subtasks

- [ ] Enhance JWT Extraction Logic
  - [ ] Update `src/plugins/auth.ts`.
  - [ ] Add logic to find and normalize the user's email from various standard OIDC claims.
  - [ ] Add logic to extract group memberships.
- [ ] Define Extended User Type
  - [ ] Update the `FastifyRequest` user interface to include `groups` array.
- [ ] Verify with Tests
  - [ ] Update `test/plugins/auth.test.ts` with a JWT containing group claims and verify extraction.

## Dev Notes

- **Architecture Compliance:** Trusted Subsystem mode workflow.
- **Identity Integrity:** Ensuring consistent email extraction across different IDPs.
- **Source Tree:**
  - `src/plugins/auth.ts`

## Dev Agent Record

### Agent Model Used

gemini-2.0-flash-thinking-exp-1219 (via Gemini CLI)
