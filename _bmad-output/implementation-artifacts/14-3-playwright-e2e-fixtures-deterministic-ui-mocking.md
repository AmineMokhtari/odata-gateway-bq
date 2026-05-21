# Story 14.3: Playwright E2E Fixtures & Deterministic UI Mocking

## Story

As a QA engineer,
I want a suite of Playwright E2E tests with deterministic mock fixtures covering visual edge cases,
So that the visual builder remains completely stable and regression-free.

## Status

Status: completed

## Story

As a QA engineer,
I want a suite of Playwright E2E tests with deterministic mock fixtures covering visual edge cases,
So that the visual builder remains completely stable and regression-free.

## Acceptance Criteria

- **AC1**: Given a local automated testing environment, When Playwright executes our visual builder E2E test suite (`visual-builder-diagnostics.spec.ts`), Then it mocks the OIDC session state and initializes mock server responses for the Neighborhood API.
- **AC2**: Tests explicitly verify that custom nodes are identifiable using strict `data-testid` attributes (e.g., `data-testid="node-Customers"`), avoiding fragile coordinate-based clicks.
- **AC3**: Schema Mismatch edge case is tested: mocking a changed `schema_version` hash in a neighborhood payload verifies that the UI correctly resets and triggers the expected Toast notification.
- **AC4**: Access Control (403) edge case is tested: mocking a 403 authorization failure on a table verifies that the UI correctly suppresses it from the ERD and opens Elena's Tips Drawer.
- **AC5**: Performance Fallback edge case is tested: mocking a massive dataset (>50 tables) verifies that the UI correctly fallbacks to "Neighborhood View" instead of drawing the full ERD.

## Tasks/Subtasks

- [x] Task 1: Scaffolding E2E Test Suite and Fixtures
  - [x] Subtask 1a: Create/update `obq-hub/tests/e2e/visual-builder-diagnostics.spec.ts`
  - [x] Subtask 1b: Verify `data-testid` attributes on ERD custom nodes
- [x] Task 2: Implement Schema Mismatch Test Case
  - [x] Subtask 2a: Mock neighborhood API with dynamic `schema_version` hashes
  - [x] Subtask 2b: Trigger schema change detection and verify Toast reset action
- [x] Task 3: Implement Access Control (403) Test Case
  - [x] Subtask 3a: Mock 403 API responses for forbidden tables
  - [x] Subtask 3b: Verify element suppression and Elena's Tips Drawer opening
- [x] Task 4: Implement Performance Fallback Test Case
  - [x] Subtask 4a: Mock large dataset response (>50 tables)
  - [x] Subtask 4b: Verify fallback to "Neighborhood View" suppression

## Dev Notes

- Visual nodes `data-testid` should be added to the react-flow custom nodes inside `obq-hub/src/components/query-builder/` or similar. Let's inspect where custom nodes are rendered (e.g., `TableNode.tsx` or similar custom component).
- Schema drift hash validation is implemented inside `loadNeighborhood` or `expandNodeNeighborhood` in Zustand store.
- Playwright tests should use `page.route` to mock gateway requests `/v1/neighborhood` and authentication session endpoints.
- Ensure the Playwright config in the frontend resolves test running correctly.

## Dev Agent Record

### Agent Model Used

Antigravity

### Debug Log References

- Debugged state synchronization gap where pre-hydrated URL search parameters (`q`) did not correctly coordinate with the empty initial React state `selectedTable`.
- Resolved multi-worker HMR fast-refresh rebuild abort errors by enforcing sequential execution under Playwright (`--workers=1`).

### Completion Notes List

- Created a high-fidelity Playwright test suite `obq-hub/tests/e2e/visual-builder-diagnostics.spec.ts` covering AC1-AC5 with robust simulated MSW and Fastify gateway backends.
- Successfully verified correct behavior for Schema Drift toast notifications, Access Control suppression, Elena drawer launches, and Neighborhood Performance Fallback boundaries.

## File List

### New Files
- [obq-hub/tests/e2e/visual-builder-diagnostics.spec.ts](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-hub/tests/e2e/visual-builder-diagnostics.spec.ts)

### Modified Files
- [obq-hub/src/components/catalog/ODataUrlBuilder.tsx](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-hub/src/components/catalog/ODataUrlBuilder.tsx)
- [obq-hub/src/components/query-builder/erd-canvas.tsx](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-hub/src/components/query-builder/erd-canvas.tsx)
- [_bmad-output/implementation-artifacts/sprint-status.yaml](file:///home/amine_mokhtari/projects/odata-gateway-bq/_bmad-output/implementation-artifacts/sprint-status.yaml)

## Change Log

- 2026-05-21: Story created, marked ready-for-dev, fully completed and verified successfully.
