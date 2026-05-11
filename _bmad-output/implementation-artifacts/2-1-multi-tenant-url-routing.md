# Story 2.1: Multi-Tenant URL Routing

Status: done

## Story

As a System,
I want to route requests based on `:projectId` and `:datasetId`,
so that I can provide isolated data environments.

## Acceptance Criteria

- **Given** a request to `/v1/:projectId/:datasetId`
- **When** parsed, **Then** operations are scoped to that context.
- **And** invalid project or dataset IDs result in a `404 Not Found` or `400 Bad Request` based on validation rules.

## Tasks / Subtasks

- [ ] Define Route Structure in Fastify (AC: 1)
  - [ ] Update `src/routes/v1/data.ts` to include `:projectId` and `:datasetId` parameters.
- [ ] Implement Multi-Tenant Scoping (AC: 2)
  - [ ] Ensure `request.params` are accessible in downstream handlers.
- [ ] Add Basic Validation (AC: 3)
  - [ ] Use Fastify schema validation to enforce naming conventions for GCP projects and BigQuery datasets.
- [ ] Verify Routing with Tests
  - [ ] Create `test/routes/data.test.ts` to verify parameter parsing.

## Dev Notes

- **Architecture Compliance:** Follow the sharded module structure defined in `architecture.md`.
- **Source Tree:** 
  - `src/routes/v1/data.ts` (New)

## Dev Agent Record

### Agent Model Used

gemini-2.0-flash-thinking-exp-1219 (via Gemini CLI)

