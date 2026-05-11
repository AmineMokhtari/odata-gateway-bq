# Story 4.4: Stateless Audit Labels

Status: done

## Story

As Marcus (Security Architect),
I want BigQuery jobs tagged with identity metadata,
so that costs are traceable.

## Acceptance Criteria

1. **Given** any BigQuery job (Query or Dry Run), **When** configured, **Then** the System injects `correlation_id` and `user_identity` labels.
2. **And** label values are in `snake_case` and follow GCP sanitization rules.
3. **And** 100% of jobs initiated by the gateway are auditable in GCP Cloud Logging via these labels.

## Tasks / Subtasks

- [ ] Add Audit Labels to Dry Runs
  - [ ] Update `performDryRun` in `src/services/bq-executor.ts` to accept `userEmail` and `correlationId`.
  - [ ] Inject labels into the dry-run job configuration.
- [ ] Refactor Labeling logic
  - [ ] Ensure `sanitizeLabelValue` (already implemented) is used consistently.
- [ ] Verify with Tests
  - [ ] Update `test/services/bq-executor.test.ts` to verify labels in dry runs.

## Dev Notes

- **Already Implemented:** `createBigQueryStream` already includes these labels (Story 3.2).
- **Scope:** This story ensures *all* gateway-initiated jobs, including dry runs, are labeled.
- **Source Tree:**
  - `src/services/bq-executor.ts`

## Dev Agent Record

### Agent Model Used

gemini-2.0-flash-thinking-exp-1219 (via Gemini CLI)

