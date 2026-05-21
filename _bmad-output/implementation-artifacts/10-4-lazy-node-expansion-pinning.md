# Story 10.4: Lazy Node Expansion & Pinning

Status: completed

## Story

As an explorer,
I want to lock node positions on the canvas and dynamically expand schema relationships on double-click,
So that I can incrementally explore huge enterprise databases without overloading the interface or losing my custom graph layout arrangements.

## Acceptance Criteria

1. **Given** a schema node on the canvas
   **When** I double-click a neighboring table node
   **Then** a lazy-loading request is dispatched with a 5-second `AbortSignal` timeout, fetching its columns and neighborhood metadata, and dynamically appending them to the active canvas.
2. **Given** a node on the canvas
   **When** I click its "Pin/Lock" button in the node header
   **Then** the node position is marked as locked (pinned), preventing any subsequent Web Worker coordinate updates from overriding its user-defined position.
3. **Given** a pinned node
   **When** rendered on the canvas
   **Then** it displays a lock icon in its header, uses a distinct high-visibility border color, and preserves its draggable locking state.

## Tasks / Subtasks

- [x] Task 1: Add Pinning & Lock State in Zustand Store (AC: 2)
  - [x] Update `Node` data structure to support `isPinned` and `isLocked` Boolean attributes.
  - [x] Add `toggleNodePin(nodeId: string)` action to the `useVisualQueryStore` Zustand state.
  - [x] Refactor `triggerAsyncLayout` to exclude pinned node coordinates from being overwritten by Web Worker calculations (preserving their `position` completely).
- [x] Task 2: Implement Lazy Node Expansion Action (AC: 1)
  - [x] Add `expandNodeNeighborhood(projectId: string, datasetId: string, nodeId: string)` action in `useVisualQueryStore`.
  - [x] Integrate a 5-second composition timeout using a native `AbortController` signal passed down to Server Actions.
  - [x] Append new unique neighbor nodes and relationship edges to the canvas while preserving existing node coordinates and pin locks.
- [x] Task 3: Update TableNode & Canvas UI Controls (AC: 1, 2, 3)
  - [x] Render a highly polished toggle pin button (pin/lock icon) in `TableNode` compact headers.
  - [x] Update borders, badges, and focus indicators for pinned nodes.
  - [x] Add `onNodeDoubleClick` handler in `ErdCanvas` invoking `expandNodeNeighborhood`.
- [x] Task 4: Integration testing and manual verification (AC: 1, 2, 3)
  - [x] Add robust unit tests covering `toggleNodePin` (ensuring worker layout bypasses pinned positions) and `expandNodeNeighborhood` with 5-second timeouts.
  - [x] Validate Next.js and backend compilations.

## Dev Notes

- **Position Locking:** Dagre layout reads pinned positions as fixed boundaries and bypasses updating them entirely in `triggerAsyncLayout`.
- **TypeScript Fix:** `TableNode` was refactored from using `NodeProps<...>` generic (which conflicts with `NodeTypes` index signature) to a direct `TableNodeComponentProps` interface with `[key: string]: unknown` index signature for xyflow compatibility.
- **AbortSignal:** `AbortController` instantiated client-side with 5s timeout; `fetchNeighborhoodAction` already propagates to the gateway fetch.

### References

- [Source: obq-hub/src/store/visual-query.ts]
- [Source: obq-hub/src/components/query-builder/table-node.tsx]
- [Source: obq-hub/src/components/query-builder/erd-canvas.tsx]

## Dev Agent Record

### Agent Model Used

Antigravity (Claude Sonnet)

### Debug Log References

- Fixed `title` prop on lucide-react `Key` icon → replaced with `aria-label` (not in LucideProps interface).
- Fixed `NodeProps<...>` TypeScript incompatibility with ReactFlow `NodeTypes` index signature → refactored to explicit `TableNodeComponentProps`.

### Completion Notes List

- Implemented `toggleNodePin` in Zustand store; pinned nodes bypass Web Worker coordinate merges in `triggerAsyncLayout`.
- Implemented `expandNodeNeighborhood` with 5-second `AbortController` timeout; incrementally merges new nodes/edges without disturbing existing pinned positions.
- Updated `TableNode` UI: amber border + lock/unlock icon toggle in header; omni-directional handles preserved.
- Wired `onNodeDoubleClick` in `ErdCanvas` → triggers `expandNodeNeighborhood` on double-click.
- Verified **5/5 frontend tests pass** and **`next build` exits 0**.

### File List

- [obq-hub/src/store/visual-query.ts](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-hub/src/store/visual-query.ts)
- [obq-hub/src/components/query-builder/table-node.tsx](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-hub/src/components/query-builder/table-node.tsx)
- [obq-hub/src/components/query-builder/erd-canvas.tsx](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-hub/src/components/query-builder/erd-canvas.tsx)
- [obq-hub/tests/unit/visual-query.test.ts](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-hub/tests/unit/visual-query.test.ts)
