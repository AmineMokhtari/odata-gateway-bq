# Story 6.3: Visual Aggregation Builder ($apply)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **Analyst (Elena)**,
I want to **apply sums, averages, and groupings via the UI**,
so that I can **generate summary data without writing manual OData `$apply` syntax**.

## Acceptance Criteria

1. **Aggregation Capability**: The URL Builder must allow selecting numerical columns for aggregation (Sum, Average, Min, Max, Count).
2. **Grouping Capability**: The UI must allow selecting columns to group by (e.g., "Group by Category").
3. **Automatic Syntax Generation**: The UI must automatically generate the complex OData `$apply=groupby((Column),aggregate(NumericalColumn with sum as Total))` syntax.
4. **Validation**: The UI must prevent invalid combinations (e.g., grouping by a column that is also being aggregated without a function).
5. **Zero-Syntax Barrier**: The user should never have to type the word `$apply` or know the transformation syntax.

## Tasks / Subtasks

- [x] **Frontend: Enhance Column Discovery**
  - [x] Update `ODataUrlBuilder` to fetch full column metadata for the selected table (including types).
- [x] **Frontend: Create Aggregation UI Components**
  - [x] Build a "Summarize Data" section with toggles for Grouping and Aggregation.
  - [x] Use `lucide-react` icons (Sigma, ListTree).
- [x] **Frontend: Implement `$apply` Logic**
  - [x] Develop a utility to transform UI state into the correct OData `$apply` string.
  - [x] Ensure `$select` and `$apply` don't conflict.
- [x] **Frontend: Update URL Builder Layout**
  - [x] Integrate the new section into the main builder card.
- [x] **Verification**
  - [x] Verify that selecting "Group by Category" and "Sum of Amount" generates the correct URL.
  - [x] Verify that the backend handles the aggregation correctly.

## Dev Notes

- **OData $apply**: This is the most complex OData transformation. Keep the UI simple (Group By + Aggregate).
- **Backend Sync**: Ensure the backend's OData provider supports transformations.
- **Reference**: [OData Data Aggregation Extension](https://docs.oasis-open.org/odata/odata-data-aggregation-ext/v4.0/odata-data-aggregation-ext-v4.0.html)

### Paths
- Frontend View: `frontend/src/components/Catalog/ODataUrlBuilder.tsx`
- Logic: `frontend/src/lib/odata-utils.ts`

## Dev Agent Record

### Agent Model Used

Antigravity (Claude 3.5 Sonnet)

### Debug Log References

### Completion Notes List

### File List

