# Story 12.3: Schema Drift & Hash Mismatch Recovery

Status: done

## Story

As an explorer,
I want the visual canvas to detect if the BigQuery schema has changed during my session and safely reset my workspace,
So that I do not generate OData queries against obsolete columns or tables.

## Acceptance Criteria

**Given** a user actively exploring a canvas with a hydrated Zustand store
**When** a new lazy-load neighborhood fetch completes
**Then** the UI compares the backend response's `schema_version` hash with the store's cached `schema_version` hash.
**And** if a hash mismatch is detected, the canvas state is safely cleared, and a globally visible Toast notification is displayed: *"Schema update detected. Visual builder has been refreshed to reflect the latest changes."*

## Task List

- [x] Task 1: Add schema version hash to metadata introspection and the Zustand visual query store
- [x] Task 2: Implement hash verification in the neighborhood fetching actions
- [x] Task 3: Implement canvas workspace reset logic and Toast notification on drift detection
- [x] Task 4: Add comprehensive unit tests in the frontend test suite to verify drift recovery

## Dev Notes

- **Schema Hash Comparison:** The backend computes a sha256 schema hash in the metadata introspection service `getDatasetMetadata` by hashing all tables, columns, and relationships in a deterministic order.
- **State Clearing:** Clearing the canvas safely means resetting selected nodes, selected edges, selected columns, and rebuilding default layout bounds.
- **Global Toast Notification:** Toast should be globally visible and clearly state the recovery actions.

## Dev Agent Record

### Agent Model Used

Antigravity (Claude 3.5 Sonnet)

### Debug Log References

- Passed 109 backend integration and dialect tests verifying introspection API returning hash.
- Passed 12 frontend unit tests verifying the state store, including the new canvas reset and toast trigger.

### Completion Notes List

- Implemented `computeSchemaHash` using Node `crypto` in the backend `bq-introspection.ts` that deterministically computes SHA-256 hashes of the current schema's tables, columns, and relationships.
- Extended the `/neighborhood` and `/schema` API endpoints to return this deterministic hash.
- Updated the visual query Zustand store in `visual-query.ts` to cache this `schemaVersion` on load.
- Added mismatch comparison checks in the store's `loadNeighborhood` and `expandNodeNeighborhood` actions; on mismatch, it calls `clearCanvas()`, stores the updated hash, and triggers a globally visible `toast.error(...)`.
- Added unit tests in `obq-hub/tests/unit/visual-query.test.ts` to mock and assert the exact mismatch recovery behavior.

### File List

- [obq-gateway/src/services/bq-introspection.ts](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-gateway/src/services/bq-introspection.ts)
- [obq-gateway/src/routes/v1/index.ts](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-gateway/src/routes/v1/index.ts)
- [obq-hub/src/store/visual-query.ts](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-hub/src/store/visual-query.ts)
- [obq-hub/src/app/actions/schema.ts](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-hub/src/app/actions/schema.ts)
- [obq-hub/tests/unit/visual-query.test.ts](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-hub/tests/unit/visual-query.test.ts)
