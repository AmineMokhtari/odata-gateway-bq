# Story 4.4: Proactive Dry-Run Visualizer

Status: ready-for-dev

## Story

As a User (Analyst),
I want to visually see why my query was blocked and receive tips on how to reduce costs,
so that I can successfully refine my filters and get my data.

## Acceptance Criteria

1. **Explain Dashboard Route:** Implement a new page at `frontend/src/app/marketplace/[projectId]/[datasetId]/[entitySet]/explain/page.tsx`.
2. **Visual Gauge:** Implement a high-contrast visual gauge using Tailwind CSS and Radix UI primitives.
    - Show `Estimated Scan` vs `Scan Budget`.
    - Color Logic: 
        - **Emerald-500 (Safety-Green):** Under budget / Safe to execute.
        - **Amber-500 (Caution-Amber):** Approaching budget / Blocked but close.
        - **Red-600 (Blocked-Red):** Significantly over budget / High cost.
    - Display values in human-readable GB/TB.
3. **SQL Preview:** Display the BigQuery SQL query translated from the OData request.
    - Use `Geist Mono` font.
    - Apply syntax highlighting or a "code block" aesthetic using Shadcn/UI.
4. **Cost-Saving Tips:** Provide a "Smart Tips" section with actionable advice:
    - "Apply a date filter (e.g., $filter=Date gt 2024-01-01)"
    - "Select only needed columns (e.g., $select=Name,Amount)"
    - "Use equality filters instead of 'contains' where possible"
5. **Backend Enhancement:** 
    - Update `backend/src/middleware/audit/dry-run-gate.ts` to include `estimatedBytes` and `budgetBytes` in the thrown error object.
    - Update `backend/src/routes/v1/index.ts` to return these values in the `BudgetExceeded` error response.
    - Append a link to the portal's explain page in the error message: `[Explain: https://.../web/marketplace/.../explain?odataQuery=...]`.
6. **Design Standards:** Adhere to the "Indigo-700 / Emerald / Amber" palette and 8px spacing system.
7. **Accessibility:** Target WCAG Level AA compliance for contrast and screen reader support.

## Tasks / Subtasks

- [ ] **Backend: Error Object Enhancement** (AC: 5)
  - [ ] Update `validateScanBudget` in `dry-run-gate.ts` to attach `estimatedBytes` and `budgetBytes` to the error.
  - [ ] Update `v1` routes in `index.ts` to catch the error and include these fields in the JSON response.
- [ ] **Backend: Error Message Linkage** (AC: 5)
  - [ ] Construct the portal URL in the backend and append it to the OData error message.
- [ ] **Frontend: Explain Page Scaffold** (AC: 1)
  - [ ] Create the dynamic route `[projectId]/[datasetId]/[entitySet]/explain/page.tsx`.
  - [ ] Implement a server-side fetch to the backend `?explain=true` endpoint (forwarding the OData query).
- [ ] **Frontend: Visual Gauge Component** (AC: 2)
  - [ ] Build a `BudgetGauge` component using Tailwind and Lucide icons.
  - [ ] Integrate with Shadcn/UI `Card` and `Badge`.
- [ ] **Frontend: SQL & Tips UI** (AC: 3, 4)
  - [ ] Implement a read-only code viewer for the SQL.
  - [ ] Implement the "Cost-Saving Tips" card with Lucide-React `Lightbulb` icons.
- [ ] **Validation & Testing** (AC: 6, 7)
  - [ ] Add Vitest unit test for `BudgetGauge`.
  - [ ] Add integration test in backend verifying the new error format.

## Dev Notes

- **OData Query Forwarding:** The `explain` page must extract the search parameters (e.g., `$filter`, `$select`) from its own URL and forward them to the backend API.
- **Statelessness:** Ensure the `explain` page is a Server Component where possible, using Client Components only for the gauge animation.
- **Palette:**
  - Primary: `bg-indigo-700`
  - Success: `bg-emerald-500`
  - Warning: `bg-amber-500` / `text-amber-900`
  - Danger: `bg-red-600`
  - Background: `bg-slate-50`
- **Source Tree:**
  - `backend/src/middleware/audit/dry-run-gate.ts`
  - `backend/src/routes/v1/index.ts`
  - `frontend/src/app/marketplace/[projectId]/[datasetId]/[entitySet]/explain/page.tsx`
  - `frontend/src/components/marketplace/BudgetGauge.tsx`

### Project Structure Notes

- Follow the App Router convention for the new route.
- Keep the common logic for GB conversion in `common/src/utils/units.ts` (create if missing).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.4]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation]
- [Source: _bmad-output/project-context.md#Critical Implementation Rules]

## Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash (CLI Agent)

### Debug Log References

### Completion Notes List

### File List

- backend/src/middleware/audit/dry-run-gate.ts
- backend/src/routes/v1/index.ts
- frontend/src/app/marketplace/[projectId]/[datasetId]/[entitySet]/explain/page.tsx
- frontend/src/components/marketplace/BudgetGauge.tsx
- frontend/src/components/marketplace/CostSavingTips.tsx
