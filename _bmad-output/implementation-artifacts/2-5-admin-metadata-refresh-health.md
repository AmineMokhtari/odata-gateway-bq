# Story 2.5: Admin Metadata Refresh & Health

Status: done

## Story

As a David (Data Admin),
I want endpoints to force refresh and check health,
so that I can manage the Catalog.

## Acceptance Criteria

1. **Given** a valid project and dataset ID, **When** a `POST` request is sent to `/admin/refresh/:projectId/:datasetId`, **Then** the system clears the corresponding entry from `metadataCache`.
2. **And** subsequent requests for `$metadata` for that tenant trigger a fresh introspection.
3. **Given** a request to `GET /health`, **Then** the system returns a `200 OK` with status information including version.
4. **And** the admin endpoints are protected by OIDC authentication.

## Tasks / Subtasks

- [ ] Implement Admin Refresh Route
  - [ ] Update `src/routes/v1/index.ts` (or create `src/routes/v1/admin.ts`) to handle `POST /admin/refresh/:projectId/:datasetId`.
  - [ ] Use `fastify.metadataCache.delete(key)` to clear cache.
- [ ] Implement/Update Health Endpoint
  - [ ] Ensure `GET /health` is public and returns version/status.
- [ ] Verify with Tests
  - [ ] Create `test/routes/admin.test.ts`.
  - [ ] Verify that cache is cleared and re-populated after refresh.

## Dev Notes

- **Architecture Compliance:** Leverage existing `metadataCache` decorators.
- **Source Tree:**
  - `src/routes/v1/admin.ts` (New)
  - `src/routes/health.ts` (Existing)

## Dev Agent Record

### Agent Model Used

gemini-2.0-flash-thinking-exp-1219 (via Gemini CLI)

