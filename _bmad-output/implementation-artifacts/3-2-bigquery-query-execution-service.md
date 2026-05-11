# Story 3.2: BigQuery Query Execution Service

Status: done

## Story

As Marcus (Security Architect),
I want all queries executed using the gateway's master identity with the user identity logged in labels,
so that access is auditable.

## Acceptance Criteria

1. **Given** translated SQL and a verified user identity (from `request.user`), **When** executed, **Then** the System creates a BigQuery Job.
2. **And** the job is executed under the gateway's master service account (default GCP identity).
3. **And** the job includes BigQuery labels: `user_identity` (sanitized email/sub) and `correlation_id` (FR20).
4. **And** the service provides a way to get a readable stream of results.

## Tasks / Subtasks

- [ ] Create Query Execution Service
  - [ ] Create `src/services/bq-executor.ts`.
  - [ ] Implement `createQueryStream(bq: BigQuery, sql: string, user: string, correlationId: string)`.
- [ ] Implement Audit Labeling (AC: 3)
  - [ ] Sanitize user identity for BigQuery label compatibility (lowercase, alphanumeric, etc.).
  - [ ] Inject `user_identity` and `correlation_id` into `job.configuration.labels`.
- [ ] Handle Master Identity Execution (AC: 2)
  - [ ] Ensure the service uses the provided BigQuery client (which uses master SA credentials).
- [ ] Verify with Unit Tests
  - [ ] Create `test/services/bq-executor.test.ts` using mocks.

## Dev Notes

- **Architecture Compliance:** Use `createQueryStream` for O(1) memory usage.
- **Labeling:** BigQuery labels have strict regex: `^[a-z][a-z0-9_-]{0,62}$`.
- **Source Tree:**
  - `src/services/bq-executor.ts`

## Dev Agent Record

### Agent Model Used

gemini-2.0-flash-thinking-exp-1219 (via Gemini CLI)

