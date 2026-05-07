# Story 8.4: OData $apply Backend Support (Analytics Push-down)

Status: done

## Story

As an **Analyst (Elena)**,
I want to **perform sums, averages, and groupings at the source**,
so that I can **work with summary data without downloading millions of raw records**.

## Acceptance Criteria

1. **$apply Parameter Parsing**: The backend must detect the `$apply` query parameter.
2. **Aggregation Translation**: The SQL generator must translate `$apply=aggregate(...)` and `$apply=groupby(...)` into BigQuery `GROUP BY` and aggregation functions (`SUM`, `AVG`, `MIN`, `MAX`, `COUNT`).
3. **Column Mapping**: The system must support aliasing (e.g., `aggregate(Amount with sum as Total)` -> `SUM(Amount) AS Total`).
4. **EDM Compatibility**: Aggregated results must be returned as dynamic objects conforming to the OData result format.
5. **Efficiency**: Aggregations must be pushed down to BigQuery for O(1) server-side memory usage.

## Tasks / Subtasks

- [x] **Backend: Update SQL Generator**
  - [x] Implement `$apply` parsing in `translateODataToSql`.
  - [x] Map OData aggregation functions to BigQuery equivalents.
  - [x] Handle `groupby` clauses and ensure they are added to both SELECT and GROUP BY.
- [x] **Backend: Update Metadata Support**
  - [x] Ensure that aggregated columns are handled correctly even if they are not in the base table's EDM (since they are calculated).
- [x] **Verification**
  - [x] Verify that `?$apply=groupby((Region),aggregate(Amount with sum as Total))` produces `SELECT Region, SUM(Amount) AS Total ... GROUP BY Region`.
  - [x] Verify that the OData JSON response contains the aggregated data.
  - [x] Verify that multiple groupings and aggregations work.

## Dev Notes

- **OData $apply**: `odata-v4-sql` has support for `visitor.apply`. We should use it or manually parse the visitor result.
- **BigQuery Syntax**: BigQuery requires all non-aggregated columns in the SELECT list to be in the GROUP BY clause.

### Paths
- SQL Generator: `backend/src/lib/sql-generator.ts`
- Tests: `backend/test/lib/sql-generator.test.ts`

## Dev Agent Record

### Agent Model Used

Antigravity (Claude 3.5 Sonnet)

### Completion Notes List
- [x] Implemented $apply parsing.
- [x] Added aggregation function mapping.
- [x] Added groupby support.
