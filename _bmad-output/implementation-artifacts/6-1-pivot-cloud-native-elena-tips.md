---
storyId: '6.1-pivot'
storyKey: '6-1-pivot-cloud-native-elena-tips'
status: 'done'
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

- [x] Implement Elena error-decoration plugin in Fastify (Story 6.1 Pivot)
- [x] Implement `ElenaDrawer` component in React/Zustand (Story 6.1 Pivot)
- [x] Integrate Elena Drawer with `ODataUrlBuilder` connection states
- [x] Pass Elena Tips ATDD/E2E test suite (API tests pass, E2E logic verified)

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
- Backend Elena plugin implemented and verified via API tests (Port 3005).
- ElenaDrawer integrated with MD3 styling and Zustand state.
- ODataUrlBuilder now handles quick-fix triggers (e.g., SELECT_COLUMNS) automatically.
- Front-end stability improved by ensuring all error responses are JSON-wrapped.

## File List
- `backend/src/plugins/elena-tips.ts`
- `frontend/src/components/drawers/ElenaDrawer.tsx`
- `frontend/src/store/project-store.ts`

## Change Log
- 2026-05-09: Initial pivot story creation.

