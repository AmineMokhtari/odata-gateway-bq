# Story 12.1: Performance Threshold & Neighborhood Fallback

Status: done

## Story

As a business user browsing a massive database,
I want the UI to automatically default to a single-table "Neighborhood View" instead of loading a monolithic ERD when the dataset exceeds 50 tables or 100 relationships,
So that my canvas loads in under 3 seconds and my browser remains perfectly responsive.

## Acceptance Criteria

1. **Given** a dataset detail page
   **When** the page loads, a Next.js Server Action queries the dataset metrics (table count and relationship count).
2. **Given** a dataset under the performance threshold (< 50 tables and < 100 relationships)
   **When** the page renders the visual query builder
   **Then** the React Flow canvas loads and renders the full ERD (all tables and relationships layout at once).
3. **Given** a massive dataset exceeding the performance threshold (>= 50 tables or >= 100 relationships)
   **When** the page renders the visual query builder
   **Then** the canvas remains empty initially, and a prominent Search/Select dropdown input is displayed prompting the user to "Select a Root Table to Explore".
   **And** selecting a table from the input triggers the asynchronous `fetchNeighborhoodAction` to load only that table's 1st-degree foreign key connections.

## Tasks / Subtasks

- [x] Task 1: Add Dataset Metrics Server Action & Introspection Endpoint (AC: 1)
  - [x] Implement `getDatasetMetricsAction(projectId: string, datasetId: string)` in `obq-hub/src/app/actions/schema.ts`.
  - [x] Leverage Fastify backend cached `metadataCache` to calculate table count and relationship counts in under 5ms, avoiding expensive BigQuery database queries.
- [x] Task 2: Implement Zustand State Fields & Actions (AC: 2, 3)
  - [x] Add `datasetMetrics` (table count and relationship count), `isFallbackMode` (boolean flag), and `metricsStatus` (`'idle' | 'loading' | 'success' | 'error'`) fields in `useVisualQueryStore`.
  - [x] Implement `loadDatasetMetrics(projectId: string, datasetId: string)` action to evaluate threshold conditions.
  - [x] Implement `loadFullSchema(projectId: string, datasetId: string)` action to fetch all dataset tables and relationships via `getDatasetSchema` and seed the full graph canvas.
- [x] Task 3: Render Threshold-Adaptive UI Layouts (AC: 2, 3)
  - [x] Update `ODataUrlBuilder.tsx` to call `loadDatasetMetrics` on mount.
  - [x] Update the `canvas` tab layout: if `isFallbackMode` is true and no active root table is chosen, display a clean, premium "Select a Root Table to Explore" selector panel with Lucide icons.
  - [x] In Fallback Mode, selecting a root table via the dropdown populates the canvas via `loadNeighborhood`.
  - [x] Under the threshold (Fallback Mode is false), automatically trigger `loadFullSchema` on mount to show the complete dataset.
- [x] Task 4: Integration testing and manual verification (AC: 1, 2, 3)
  - [x] Add comprehensive unit tests in `visual-query.test.ts` verifying metrics evaluation, Fallback Mode toggle flags, and full schema loading.
  - [x] Verify that Next.js and backend compilation succeeds with zero lint warnings.

## Dev Notes

- **Threshold Guardrail Rules:**
  - Table count limit: `50`
  - Relationship count limit: `100`
  - If either condition is exceeded, set `isFallbackMode = true` and prompt root table selection.
- **Server Action Performance:** `getDatasetSchema` fetches cached schema results from the Fastify cache. Computing metrics there is fast, type-safe, and server-to-server compliant.
- **Dagre Worker Layout:** When `loadFullSchema` is triggered, Dagre computes asynchronous coordinates for all nodes in the Web Worker, keeping the browser interactive.

### References

- [Source: obq-hub/src/app/actions/schema.ts](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-hub/src/app/actions/schema.ts)
- [Source: obq-hub/src/store/visual-query.ts](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-hub/src/store/visual-query.ts)
- [Source: obq-hub/src/components/catalog/ODataUrlBuilder.tsx](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-hub/src/components/catalog/ODataUrlBuilder.tsx)
- [Source: obq-hub/src/components/query-builder/erd-canvas.tsx](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-hub/src/components/query-builder/erd-canvas.tsx)

## Dev Agent Record

### Agent Model Used

Antigravity (Claude Sonnet)

### Debug Log References

No critical bugs or debug loops were encountered. TypeScript compilation and React Flow layout rendering completed flawlessly on the first iteration.

### Completion Notes List

- Implemented fast metrics calculation backend Server Action using high-performance Fastify API cache.
- Designed Zustand store loading mechanisms to dynamically switch rendering between full ERD graph schema layout and neighborhood focus view.
- Added adaptive UI card containing Lucide icons, select dropdown table lookup, and clear layout descriptions for threshold fallback state.
- Verified functionality and edge cases with 11/11 passing unit tests in `visual-query.test.ts` and successful Next.js builds.

### File List

- [obq-hub/src/app/actions/schema.ts](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-hub/src/app/actions/schema.ts)
- [obq-hub/src/store/visual-query.ts](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-hub/src/store/visual-query.ts)
- [obq-hub/src/components/catalog/ODataUrlBuilder.tsx](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-hub/src/components/catalog/ODataUrlBuilder.tsx)
- [obq-hub/src/components/query-builder/erd-canvas.tsx](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-hub/src/components/query-builder/erd-canvas.tsx)
- [obq-hub/tests/unit/visual-query.test.ts](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-hub/tests/unit/visual-query.test.ts)
