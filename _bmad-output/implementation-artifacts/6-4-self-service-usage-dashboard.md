# Story 6.4: Self-Service Usage Dashboard

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **Analyst (Elena)**,
I want to **see my current scan usage vs. budget in a visual chart**,
so that I can **manage my data consumption proactively** without waiting for a finance report.

## Acceptance Criteria

1. **Real-Time Usage Query**: The backend must provide an endpoint that queries BigQuery `INFORMATION_SCHEMA.JOBS_BY_PROJECT` to calculate total `total_bytes_billed` for the current user (filtered by OIDC email label).
2. **Visual Progress Gauge**: The Web Portal must display a "Monthly Usage" card featuring a progress bar or gauge showing "Used GB" vs "Monthly Budget".
3. **Usage Breakdown**: The UI should show a simple breakdown of the last 5 queries (time, bytes, and status).
4. **Budget Alignment**: The dashboard must use the `scan_budget_gb` defined in the `TenantConfig`.
5. **Persona-Friendly UI**: Use encouraging messaging (e.g., "You have 15GB left this month, great job!").

## Tasks / Subtasks

- [x] **Backend: Implement Usage Service**
  - [x] Create `backend/src/services/usage-audit.ts` to query BigQuery audit logs.
  - [x] Implement `getUserUsage(email, projectId, datasetId)` function.
- [x] **Backend: Create Usage Route**
  - [x] Add `GET /v1/:projectId/:datasetId/usage` endpoint.
  - [x] Ensure it uses the authenticated user's email.
- [x] **Frontend: Create `UsageDashboard` Component**
  - [x] Build a premium card with a progress bar and usage stats.
  - [x] Use `framer-motion` for smooth progress animations.
- [x] **Frontend: Integrate into Catalog**
  - [x] Add a "My Usage" section to the URL Builder view.
- [x] **Verification**
  - [x] Verify that usage data is displayed correctly.
  - [x] Verify that the progress bar accurately reflects budget percentage.

## Dev Notes

- **BigQuery Audit**: Use `INFORMATION_SCHEMA.JOBS_BY_PROJECT` (or `JOBS_BY_USER` if appropriate).
- **Labels**: Remember we attach end-user email as a label in Story 5.1.
- **Budget Source**: Fetch `scan_budget_gb` from the tenant configuration.

### Paths
- Backend Service: `backend/src/services/usage-tracker.ts`
- Backend Route: `backend/src/routes/v1/index.ts`
- Frontend Component: `frontend/src/components/Catalog/UsageDashboard.tsx`

## Dev Agent Record

### Agent Model Used

Antigravity (Claude 3.5 Sonnet)

### Debug Log References

### Completion Notes List

### File List

