# Story 4.3: OData Usage & Explain Endpoints

Status: done

## Story

As Elena (Business Analyst),
I want to see my usage and query impact,
so that I can stay within budget.

## Acceptance Criteria

1. **Given** a data fetch request, **When** the query string includes `explain=true`, **Then** the System returns the generated SQL and Dry-Run estimate instead of executing the query.
2. **And** the "Explain" response follows a standardized format including `sql` and `estimated_bytes`.
3. **Given** a request to `GET /admin/usage`, **Then** the System returns a summary of query consumption (e.g., total bytes processed) for the last 24 hours.
4. **And** the usage tracking is isolated per tenant.

## Tasks / Subtasks

- [ ] Implement `?$explain=true` Support
  - [ ] Update the data fetch handler in `src/routes/v1/index.ts`.
  - [ ] If `explain=true` is present, return the SQL and Dry-Run result early.
- [ ] Implement Usage Tracking
  - [ ] Create `src/plugins/usage-tracker.ts`.
  - [ ] Implement an in-memory store (or use `metadataCache` with a different key prefix) to track bytes processed per tenant.
  - [ ] Increment the counter after successful (non-explain) queries.
- [ ] Create Usage Admin Endpoint
  - [ ] Add `GET /admin/usage/:projectId/:datasetId` to `src/routes/v1/index.ts`.
  - [ ] Return the tracked usage for the specified tenant.
- [ ] Verify with Tests
  - [ ] Add test cases in `test/routes/v1-data.test.ts` for `explain=true`.
  - [ ] Add test cases for usage reporting.

## Dev Notes

- **Architecture Compliance:** Operational endpoints like `/admin/usage`.
- **Explain Format:**
  ```json
  {
    "sql": "SELECT ...",
    "estimatedBytes": 12345
  }
  ```
- **Source Tree:**
  - `src/plugins/usage-tracker.ts`
  - `src/routes/v1/index.ts` (Update)

## Dev Agent Record

### Agent Model Used

gemini-2.0-flash-thinking-exp-1219 (via Gemini CLI)
