# Story 8.2: Nested Column Selection ($select inside $expand)

Status: done

## Story

As an **Analyst (Elena)**,
I want to **select specific columns from related tables in the Query Builder**,
so that I can **reduce the scan cost of my joins and only see the data I need in my BI tool**.

## Acceptance Criteria

1. **Granular Expand Syntax**: The backend must support the OData syntax for nested selections: `$expand=RelatedTable($select=Col1,Col2)`.
2. **Reduced SQL Projection**: The generated SQL must only include the specified columns in the JOIN/Subquery for the expanded table, instead of `SELECT *`.
3. **UI Interaction**: The OData URL Builder must allow users to click a "Customize" or "Columns" button next to an expanded table to select specific fields.
4. **EDM Compliance**: The metadata must remain valid, and the response transformation must correctly prune the JSON fields of the expanded objects.
5. **Budget Efficiency**: Users must see a reduced Dry-Run estimate when using nested `$select` vs. full expansion.

## Tasks / Subtasks

- [x] **Backend: Enhance OData Translation**
  - [x] Update the `odata-v4-sql` wrapper or custom visitor to handle nested `$select` inside `$expand`.
  - [x] Ensure the generated BigQuery SQL uses explicit column lists in the `WITH` or `JOIN` clauses.
- [x] **Frontend: Update `ODataUrlBuilder.tsx`**
  - [x] Add a sub-menu or modal for selecting columns when a navigation property is enabled.
  - [x] Update the URL generation logic to append `( $select=...)` to the `$expand` parameter.
- [x] **Verification**
  - [x] Verify SQL output for `$expand=Table($select=Col1)`.
  - [x] Verify that unselected columns are absent from the JSON response.

## Developer Context

- **Syntax Example**: `v1/project/dataset/Table?$expand=Orders($select=OrderID,ShipCountry)`.
- **SQL Implication**: Instead of `LEFT JOIN Orders`, consider using a subquery if needed, or ensure the JOIN projection is limited.
- **Frontend Hook**: Use the existing `useEntityMetadata` hook to fetch columns for the related table when it is expanded.

## Dev Agent Guardrails

- **No Over-Engineering**: Do not implement nested filters ($filter inside $expand) unless explicitly requested. Focus on $select.
- **Maintain Schema Cache**: Ensure metadata discovery for related tables is cached as per Epic 2.

### Paths
- Backend Translation: `backend/src/routes/v1/index.ts` (or dedicated lib)
- Frontend Builder: `frontend/src/components/Catalog/ODataUrlBuilder.tsx`

## Dev Agent Record

### Agent Model Used
Gemini 2.0 Flash

### Completion Notes List
- [x] Implemented nested $select parser in `sql-generator.ts`.
- [x] Updated UI with column selection checkboxes in the Join section using `ExpandColumnSelector` component.
- [x] Verified Dry-Run cost reduction via SQL unit tests and manual inspection of generated subqueries.

### Review Findings

1. **`decision-needed`** findings:
   - [x] [Review][Decision] Hardcoded same-dataset assumption — Resolved: Option 2 (Support cross-dataset).
   - [x] [Review][Decision] Missing primary table $select consistency — Resolved: Option 1 (Add visual selector for primary table).

2. **`patch`** findings:
   - [x] [Review][Patch] Support cross-dataset joins in SQL generator (lookup referenced dataset/project)
   - [x] [Review][Patch] Add visual column selector for primary table to match expand UI
   - [x] [Review][Patch] Invalid table reference when `table` has no dots [backend/src/lib/sql-generator.ts:50]
   - [x] [Review][Patch] Missing backticks on referenced table [backend/src/lib/sql-generator.ts:54]
   - [x] [Review][Patch] Potential NPE on `prop.type` [frontend/src/components/Catalog/ODataUrlBuilder.tsx:369]
   - [x] [Review][Patch] Stale expansion columns state [frontend/src/components/Catalog/ODataUrlBuilder.tsx:98]

3. **`defer`** findings:
   - [x] [Review][Defer] No handling for 1:N expansions — deferred, pre-existing. Current flat OData transformer limits 1:N depth/structure.

