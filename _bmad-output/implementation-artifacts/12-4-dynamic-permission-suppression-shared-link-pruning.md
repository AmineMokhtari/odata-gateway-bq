# Story 12.4: Dynamic Permission Suppression & Shared Link Pruning

Status: done

## Dev Notes

- **Error Catching:** If a sub-table generates a `403` error on dry-run, we should map that to the specific `Unauthorized` Elena Tip with custom text.
- **Node/Path Pruning:** Paths matching the restricted node (`nodeName` or `source->target` where one of the nodes is restricted) must be removed from `selected_paths` in the store.
- **Auto Drawer Display:** When hydrated and a dry-run fails with 403 on a sub-table, we call `setElenaTip` with a custom message and call `openElenaDrawer()`.

## Dev Agent Record

### Agent Model Used

Antigravity (Gemini 1.5 Pro)

### Debug Log References

- Dry-Run integration catching 403 authorization failures on `Billing` in `index.ts`
- Hydration execution audit hook in `erd-canvas.tsx` using Server Action `dryRunQueryAction`

### Completion Notes List

- Implemented IAM 403 dry-run error interception with structured `ELENA_TIP` on the gateway backend.
- Created simulated 403 Access Denied exception for queries targeting `Billing` table during test execution.
- Implemented `pruneUnauthorizedPaths` on Zustand state store, dynamically removing filtered column paths, join edges, and node elements before restoring layout.
- Integrated automated post-hydration audit execution inside `erd-canvas.tsx` that triggers on loading shared URLs, automatically hides restricted tables, and opens Elena Drawer.
- Created backend Fastify tests (`v12-4-permission-suppression.test.ts`) and frontend Zustand store unit tests (`visual-query.test.ts`) which all pass cleanly.
- Confirmed a successful Next.js production build with exit code 0.

## Story

As a user loading a shared query builder URL,
I want the canvas and query compiler to automatically prune any tables I do not have active IAM authorization to query,
So that I can safely collaborate without getting fatal access crashes or security violations.

## Acceptance Criteria

**Given** a shared URL containing serialized logical query paths (e.g., `Customers` and `Billing`)
**When** the frontend hydrates the Zustand store and issues the initial `/dry-run` pre-execution audit
**Then** if the backend returns a `403 Forbidden` (`Unauthorized` code) due to GCP IAM restrictions on a sub-table, the "Elena's Tips" engine intercepts the error.
**And** the UI automatically hides/prunes the unauthorized table nodes and their associated query paths from `selected_paths`.
**And** the Elena Tips Drawer automatically slides open to explain: *"Some tables from this shared query have been pruned as you do not have permission to access them. Click here to re-authorize with a clean, budget-safe subset."*

## Task List

- [x] Task 1: Update error mapping and introduce IAM 403 authorization backend failure simulation for a designated restricted table
- [x] Task 2: Implement initial dry-run audit execution inside the visual query builder canvas on hydration
- [x] Task 3: Implement dynamic pruning of unauthorized paths and auto-triggering of Elena Tips Drawer in the frontend store and canvas
- [x] Task 4: Author comprehensive unit/e2e tests in the test suite to verify authorization pruning and auto-drawer launch

## Dev Notes

- **Error Catching:** If a sub-table generates a `403` error on dry-run, we should map that to the specific `Unauthorized` Elena Tip with custom text.
- **Node/Path Pruning:** Paths matching the restricted node (`nodeName` or `source->target` where one of the nodes is restricted) must be removed from `selected_paths` in the store.
- **Auto Drawer Display:** When hydrated and a dry-run fails with 403 on a sub-table, we call `setElenaTip` with a custom message and call `openElenaDrawer()`.

## Dev Agent Record

### Agent Model Used

Antigravity (Claude 3.5 Sonnet)

### Debug Log References

*(To be filled during dev)*

### Completion Notes List

*(To be filled during dev)*

### File List

- [obq-gateway/src/routes/v1/index.ts](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-gateway/src/routes/v1/index.ts)
- [obq-hub/src/store/project-store.ts](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-hub/src/store/project-store.ts)
- [obq-hub/src/store/visual-query.ts](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-hub/src/store/visual-query.ts)
- [obq-hub/src/components/query-builder/erd-canvas.tsx](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-hub/src/components/query-builder/erd-canvas.tsx)
- [obq-hub/tests/unit/visual-query.test.ts](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-hub/tests/unit/visual-query.test.ts)
