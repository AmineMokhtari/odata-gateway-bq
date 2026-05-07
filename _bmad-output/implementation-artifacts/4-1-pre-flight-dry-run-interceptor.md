# Story 4.1: Pre-Flight Dry-Run Interceptor

Status: done

## Story

As a David (Data Admin),
I want every query estimated before it runs,
so that I can prevent bill shock.

## Acceptance Criteria

1. **Given** translated SQL, **When** a data fetch is requested, **Then** the System performs a BigQuery Dry Run (`dryRun: true`).
2. **And** the System extracts `totalBytesProcessed` from the Dry Run job statistics.
3. **And** the System rejects the request with a `400 Bad Request` and OData error code `BudgetExceeded` if the estimate exceeds the tenant's configured scan budget (defaulting to 10GB if not specified).
4. **And** the Dry Run itself does not incur any GCP billing costs.

## Tasks / Subtasks

- [ ] Update BigQuery Executor for Dry Runs
  - [ ] Update `src/services/bq-executor.ts` to include a `performDryRun(bq: BigQuery, sql: string, location?: string)` method.
- [ ] Implement Dry-Run Gate Middleware
  - [ ] Create `src/middleware/audit/dry-run-gate.ts`.
  - [ ] Implement logic to:
    1. Call `performDryRun`.
    2. Check `totalBytesProcessed` against a threshold.
    3. Throw an error if threshold is exceeded.
- [ ] Integrate into Request Pipeline
  - [ ] Update `src/routes/v1/index.ts` to call the Dry-Run gate before starting the actual query stream.
- [ ] Verify with Tests
  - [ ] Create `test/middleware/dry-run-gate.test.ts` using mocks for BigQuery Dry Run results.
  - [ ] Add integration test in `test/routes/v1-data.test.ts` verifying rejection when budget is exceeded.

## Dev Notes

- **Architecture Compliance:** Mandatory pre-execution Dry Run.
- **Error Format:** `{ "error": { "code": "BudgetExceeded", "message": "Query estimate (X bytes) exceeds budget (Y bytes)" } }`.
- **Source Tree:**
  - `src/middleware/audit/dry-run-gate.ts`
  - `src/services/bq-executor.ts` (Update)

## Dev Agent Record

### Agent Model Used

gemini-2.0-flash-thinking-exp-1219 (via Gemini CLI)
