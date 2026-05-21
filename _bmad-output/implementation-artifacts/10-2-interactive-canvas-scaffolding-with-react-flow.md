# Story 10.2: Interactive Canvas Scaffolding with React Flow

Status: completed

## Story

As an explorer,
I want to see an interactive 2D canvas displaying table nodes and relationship edges for my current dataset,
So that I can visually inspect the metadata structure.

## Acceptance Criteria

1. **Given** the Next.js `obq-hub` portal
   **When** I navigate to a dataset detail page
   **Then** a dedicated Next.js Server Action (`fetchNeighborhoodAction`) is triggered asynchronously to fetch the neighborhood metadata (preserving the <2s OData `$metadata` latency).
2. **Given** a rendering request for a dataset segment in the portal
   **When** visual layout is prepared
   **Then** a React Flow canvas is rendered containing nodes for the root table and its immediate relationships, styled strictly using Google Cloud MD3 compact tokens (Roboto/Inter typography, semantic borders, and high-visibility focus indicators).
3. **Given** the visual explorer UI
   **When** loaded in the browser
   **Then** the canvas includes React Flow's native `<MiniMap>` and `<Controls>` widgets.

## Tasks / Subtasks

- [x] Task 1: Scaffolding state and Server Action (AC: 1)
  - [x] Implement the Next.js Server Action `fetchNeighborhoodAction(projectId: string, datasetId: string, table: string)` in `obq-hub/src/app/actions/schema.ts` using `GatewayClient`.
  - [x] Configure standard error mapping and fallback strategies returning structured error states.
- [x] Task 2: Setting up Zustand Store scaffolding (AC: 2)
  - [x] Create `obq-hub/src/store/visual-query.ts` to hold temporary states like `nodes` and `edges` for React Flow.
  - [x] Default visual store coordinates to a circular layout grid placeholder before the worker engine is fully integrated.
- [x] Task 3: Build interactive React Flow ERD Canvas (AC: 2, 3)
  - [x] Initialize React Flow in the target portal view (`obq-hub/src/components/query-builder/erd-canvas.tsx`).
  - [x] Integrate `<MiniMap>` and `<Controls>` widgets to fulfill AC 3.
  - [x] Style the custom React Flow nodes using elegant GC MD3 compact tokens (harmonious dark/light mode borders, Google Fonts, and precise visual node sizing).
- [x] Task 4: Integration testing and manual verification (AC: 1, 2)
  - [x] Create mock metadata fixtures to verify offline rendering.
  - [x] Add unit/integration tests ensuring `fetchNeighborhoodAction` is executing correctly and returning structured nodes and edges data.

## Dev Notes

- **React Flow Package:** Installed `@xyflow/react` and `dagre` supporting React 19 / Next.js 16 completely.
- **GC MD3 Aesthetics:** Compact sizing, modern harmonious color palette (vibrant indigo, slate background, glassmorphism), clear focus outlines for keyboard navigation, high-contrast borders for accessibility.
- **Paths:**
  * `obq-hub/src/app/actions/schema.ts` (Server Action)
  * `obq-hub/src/components/query-builder/erd-canvas.tsx` (React Flow Component)
  * `obq-hub/src/store/visual-query.ts` (Zustand state integration)
  * `obq-hub/src/components/query-builder/table-node.tsx` (Custom Table Node UI)

### References

- [Source: obq-hub/src/lib/gateway-client.ts] (unified client fetch engine)

## Dev Agent Record

### Agent Model Used

Antigravity

### Debug Log References

- Executed component unit tests in `obq-hub` which compiled and successfully verified both store modifications and server actions.
- Completed full Turbopack Next.js build with 0 typescript/lint compilation warnings.

### Completion Notes List

- Implemented `fetchNeighborhoodAction` Server Action inside `obq-hub/src/app/actions/schema.ts`.
- Created Zustand store `useVisualQueryStore` in `obq-hub/src/store/visual-query.ts` to manage coordinates and visual changes.
- Developed `TableNode` custom UI component satisfying MD3 styling, highlighting partition keys with amber icons, and declaring 4 omnidirectional Handles.
- Built `ErdCanvas` wrapper, integrated standard Background (variant Lines), Controls, and MiniMap elements.
- Successfully verified workspace and client connectivity through standard Node test framework.

### File List

- [obq-hub/src/app/actions/schema.ts](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-hub/src/app/actions/schema.ts)
- [obq-hub/src/store/visual-query.ts](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-hub/src/store/visual-query.ts)
- [obq-hub/src/components/query-builder/table-node.tsx](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-hub/src/components/query-builder/table-node.tsx)
- [obq-hub/src/components/query-builder/erd-canvas.tsx](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-hub/src/components/query-builder/erd-canvas.tsx)
- [obq-hub/src/components/catalog/ODataUrlBuilder.tsx](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-hub/src/components/catalog/ODataUrlBuilder.tsx)
- [obq-hub/tests/unit/visual-query.test.ts](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-hub/tests/unit/visual-query.test.ts)
