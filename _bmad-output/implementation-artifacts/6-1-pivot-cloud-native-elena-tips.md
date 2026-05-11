---
storyId: '6.1-pivot'
storyKey: '6-1-pivot-cloud-native-elena-tips'
status: 'ready-for-dev'
date: '2026-05-09'
---

# Story 6.1-Pivot: Cloud-Native Elena's Tips

## Story

As an **Analyst (Elena)**,
I want to see **Google Cloud Console-style advice** when my query fails,
so that I can **fix the issue myself** within the new Material Design 3 interface.

## Acceptance Criteria

1. **Backend Error Decoration**: The Fastify backend must intercept BigQuery `BudgetExceeded` and `Unauthorized` errors and append a `elena_tip` object to the response.
2. **MD3 Advice Drawer**: The React frontend must implement a `ElenaDrawer` component using Shadcn/UI that opens when a query fails.
3. **Actionable Fixes**: The drawer must display at least one "Quick Fix" button (e.g., "Add Date Filter") that modifies the active OData query in the Zustand store.
4. **TDD Compliance**: Implementation is only complete when the ATDD tests in `tests/api/elena-tips.spec.ts` and `tests/e2e/elena-tips.spec.ts` pass.

## Tasks / Subtasks

- [ ] **Backend: Implement Elena Plugin**
  - [ ] Create `backend/src/plugins/elena-tips.ts`.
  - [ ] Intercept 403 and 401 errors.
  - [ ] Inject `elena_tip` metadata.
- [ ] **Frontend: Implement Elena Drawer**
  - [ ] Create `frontend/src/components/drawers/ElenaDrawer.tsx` (MD3 Style).
  - [ ] Bind drawer visibility to the new `useProjectStore` Zustand state.
  - [ ] Add "Apply Fix" logic that updates the URL builder state.
- [ ] **Verification: Green Phase**
  - [ ] Remove `test.skip()` from `tests/api/elena-tips.spec.ts`.
  - [ ] Run API tests and verify they pass.
  - [ ] Remove `test.skip()` from `tests/e2e/elena-tips.spec.ts`.
  - [ ] Run E2E tests and verify the full "Elena" journey.

## Dev Notes

- **Architecture Ref**: Refer to `_bmad-output/planning-artifacts/architecture.md` for the "Reactive UI Flow".
- **ATDD Ref**: Refer to `_bmad-output/test-artifacts/atdd-checklist-elena-tips.md` for the red-phase scaffolds.
- **State**: Use `useProjectStore` in `frontend/src/store/project-store.ts`.

## Dev Agent Record

### Implementation Plan
1. **Red Phase**: Confirm `npx playwright test` fails for the new tests.
2. **Backend**: Implement the Fastify error-decoration logic.
3. **Frontend**: Build the React component and wire the Zustand state.
4. **Green Phase**: Verify tests pass.

### Debug Log
- (Empty)

### Completion Notes
- (Empty)

## File List
- `backend/src/plugins/elena-tips.ts`
- `frontend/src/components/drawers/ElenaDrawer.tsx`
- `frontend/src/store/project-store.ts`

## Change Log
- 2026-05-09: Initial pivot story creation.

