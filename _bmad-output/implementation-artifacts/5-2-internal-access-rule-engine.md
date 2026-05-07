# Story 5.2: Internal Access Rule Engine

Status: done

## Story

As a David (Data Admin),
I want an internal rule engine,
so that I can grant access without IAM changes.

## Acceptance Criteria

1. **Given** a data fetch request, **When** processed in Trusted Subsystem mode, **Then** the System validates the user's identity (from Story 5.1) against internal `access_rules` defined in `config/tenants.yaml`.
2. **And** access rules support matching by specific `emails` or `groups`.
3. **And** if a user matches at least one rule (email or group), access is granted.
4. **And** if no rules match, the request is rejected with `403 Forbidden` and OData error code `Unauthorized`.
5. **And** the rule evaluation overhead is < 200ms.

## Tasks / Subtasks

- [x] Update Configuration Schema
  - [x] Add `access_rules` section to `TenantConfig` interface in `src/plugins/00-config-loader.ts`.
  - [x] Update `config/tenants.yaml` with sample rules.
- [x] Implement Authorization Middleware
  - [x] Create `src/middleware/auth/access-control.ts`.
  - [x] Implement `checkTenantAccess(user: UserIdentity, config: TenantConfig): boolean`.
- [x] Integrate into Request Pipeline
  - [x] Update `src/routes/v1/index.ts`.
  - [x] Call the access control check before performing the BigQuery Dry Run.
- [x] Verify with Tests
  - [x] Create `test/middleware/access-control.test.ts`.
  - [x] Add integration tests in `test/routes/v1-data.test.ts` for authorized and unauthorized scenarios.


## Dev Notes

- **Architecture Compliance:** Rule engineprocesses request against internal config in < 200ms.
- **Rule Logic:** OR logic (User OR Group match).
- **Source Tree:**
  - `src/middleware/auth/access-control.ts`
  - `src/plugins/00-config-loader.ts` (Update)

## Dev Agent Record

### Agent Model Used

gemini-2.0-flash-thinking-exp-1219 (via Gemini CLI)
