# Story 8.3: OData $count Backend Support

Status: done

## Story

As a **BI User (Elena)**,
I want to **see the total number of records in my dataset**,
so that **my BI tools (Excel/Power BI) can accurately display paging progress and total volume**.

## Acceptance Criteria

1. **$count Parameter Parsing**: The backend must detect the `$count=true` query parameter in the OData request.
2. **Total Count Extraction**: When `$count=true` is present, the system must return the total number of rows matching the filters.
3. **Efficiency**: The total count MUST be retrieved from the BigQuery Job metadata (`totalRows` from the statistics) after execution, avoiding an extra `SELECT COUNT(*)` query.
4. **Response Envelope**: The count must be included in the OData JSON response as `@odata.count` (at the same level as `value`).
5. **Consistency**: The count must respect the `$filter` criteria but ignore `$top` and `$skip`.

## Tasks / Subtasks

- [x] **Backend: Update OData Translation**
  - [x] Update `translateODataToSql` or the route handler to detect `$count`.
- [x] **Backend: Update Result Transformer**
  - [x] Update `ODataEnvelopeTransformer` to support an optional `count` property in the envelope.
- [x] **Backend: Update Route Handler (`routes/v1/index.ts`)**
  - [x] Extract `totalRows` from the BigQuery job statistics after the query completes.
  - [x] Pass the count to the result transformer if `$count=true` was requested.
- [x] **Verification**
  - [x] Verify that `?$count=true` adds `@odata.count` to the JSON response.
  - [x] Verify that the count is correct even when `$top` is used.
  - [x] Verify that no extra BigQuery job is created for the count (check audit labels).

## Dev Notes

- **BigQuery Statistics**: The `totalRows` is available in `job.metadata.statistics.query.totalRows` or from the first page of results.
- **OData Standard**: `@odata.count` is the standard property name for V4.

### Paths
- Backend Transformer: `backend/src/lib/transformers/odata-envelope.ts`
- Route Handler: `backend/src/routes/v1/index.ts`
- SQL Generator: `backend/src/lib/sql-generator.ts`

## Dev Agent Record

### Agent Model Used

Antigravity (Claude 3.5 Sonnet)

### Completion Notes List
- [ ] Implemented $count detection.
- [ ] Updated transformer to inject @odata.count.
- [ ] Optimized count retrieval from Job metadata.
