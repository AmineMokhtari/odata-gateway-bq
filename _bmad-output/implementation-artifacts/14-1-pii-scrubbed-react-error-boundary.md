# Story 14.1: PII-Scrubbed React Error Boundary

## Story

As an administrator,
I want unhandled visual canvas exceptions to be intercepted by a React Error Boundary that scrubs all proprietary database schema names before transmission,
So that we can diagnose visual crashes in production without leaking highly sensitive organizational data.

## Status

review

## Acceptance Criteria

- **AC1**: Given an unhandled runtime error inside the `<ErdCanvas>` component, When the error triggers the React Error Boundary, Then the UI thread does not crash the entire browser window; instead, it renders a friendly Google Cloud-style "Visualizer Offline" empty state.
- **AC2**: The boundary captures the exact Zustand state (`nodes` and `selected_paths`) and passes it to a local scrubbing utility.
- **AC3**: The utility replaces all raw table names, field names, and OData paths with consistent SHA-256 hashes (e.g., `Customers` -> `7f2d...`), leaving only layout topology and coordinate data in the payload.
- **AC4**: The PII-scrubbed diagnostic payload is logged to the console (backend error logging endpoint is deferred to Story 14.2).

## Tasks/Subtasks

- [x] Task 1: Create the PII scrubbing utility (`obq-hub/src/lib/pii-scrubber.ts`)
  - [x] Subtask 1a: Implement `scrubPII(state)` function that takes Zustand state snapshot and replaces all table names, column names, and OData path segments with truncated SHA-256 hashes
  - [x] Subtask 1b: Preserve layout topology data (x, y coordinates, edge source/target structure) while scrubbing all identifier strings
  - [x] Subtask 1c: Write unit tests for the scrubber in `obq-hub/tests/unit/pii-scrubber.test.ts`
- [x] Task 2: Create the Error Boundary component (`obq-hub/src/components/query-builder/erd-error-boundary.tsx`)
  - [x] Subtask 2a: Implement a React class component Error Boundary with `getDerivedStateFromError` and `componentDidCatch`
  - [x] Subtask 2b: Render a Google Cloud-style "Visualizer Offline" fallback UI with a retry button
  - [x] Subtask 2c: In `componentDidCatch`, capture Zustand state snapshot, scrub PII, and log the diagnostic payload
- [x] Task 3: Wrap ErdCanvas with the Error Boundary in `ODataUrlBuilder.tsx`
- [x] Task 4: Add E2E verification test in `tests/e2e/epic-14-diagnostics.spec.ts`

## Dev Notes

- The `ErdCanvas` component is rendered inside `ODataUrlBuilder.tsx` at approximately line 682.
- Zustand store fields to scrub: `nodes` (contains `data.label`, `data.columns[].name`, `data.partitionColumn`), `selected_paths` (contains table and column path strings), `edges` (contains `source`, `target` which are table names).
- Use a deterministic synchronous hash function (djb2 variant) for consistent hashing. Produces 8-char hex digests.
- The fallback UI matches the existing Google Cloud design aesthetic used throughout the app.
- No backend telemetry endpoint exists yet — that is Story 14.2. For now, `console.error` the scrubbed payload.

## Dev Agent Record

### Implementation Plan
1. Created `pii-scrubber.ts` utility with `deterministicHash()` and `scrubPII()` functions
2. Created `erd-error-boundary.tsx` React class Error Boundary component with GC-style fallback UI
3. Wrapped `<ErdCanvas>` in `<ErdErrorBoundary>` inside ODataUrlBuilder.tsx
4. Added comprehensive unit tests (18 tests) and E2E structural tests

### Debug Log
- All 18 unit tests pass on first run
- TypeScript compilation clean for all new source files
- E2E tests require dev server to be running (infrastructure dependency)

### Completion Notes
- ✅ PII scrubber utility created with 18 passing unit tests covering hash consistency, identifier scrubbing, coordinate preservation, path scrubbing, and edge cases
- ✅ React Error Boundary component created with Google Cloud-style "Visualizer Offline" fallback UI, retry button, and PII-scrubbed console logging
- ✅ ErdCanvas wrapped with Error Boundary in ODataUrlBuilder.tsx
- ✅ E2E test suite created for structural verification

## File List

### New Files
- `obq-hub/src/lib/pii-scrubber.ts` — PII scrubbing utility with deterministicHash and scrubPII
- `obq-hub/src/components/query-builder/erd-error-boundary.tsx` — React Error Boundary component
- `obq-hub/tests/unit/pii-scrubber.test.ts` — 18 unit tests for PII scrubber
- `obq-hub/tests/e2e/epic-14-diagnostics.spec.ts` — E2E structural tests

### Modified Files
- `obq-hub/src/components/catalog/ODataUrlBuilder.tsx` — Added ErdErrorBoundary import and wrapped ErdCanvas

## Change Log

- 2026-05-21: Story 14.1 implementation complete — PII scrubber, Error Boundary, canvas wrapping, and tests
