# Story 8.1: Smart Paging (Query Cursors)

Status: in-progress

## Story

As an **Analyst (Elena)**,
I want the system to **efficiently handle multi-page datasets**,
so that I can **scroll through thousands of rows in Excel without paying for full BigQuery re-scans on every page**.

## Acceptance Criteria

1. **Job ID Propagation**: When a query results in multiple pages, the first response must include an `@odata.nextLink` containing a `$skiptoken` with the BigQuery `jobId`.
2. **Result Reuse**: When a request contains a `$skiptoken` with a valid `jobId`, the backend must fetch results directly from that BigQuery Job's temporary results table instead of executing a new SQL query.
3. **Pagination Continuity**: The `$skiptoken` must track the current offset (e.g., `jobId:OFFSET`) to allow sequential paging.
4. **Cost Efficiency**: Using a query cursor must incur **zero additional scan bytes** (verified via Audit logs).
5. **Transparency**: The "Usage Dashboard" should distinguish between "New Scans" and "Cached Refreshes".

## Tasks / Subtasks

- [ ] **Backend: Enhance `bq-executor.ts`**
  - [ ] Implement `getJobResultStream(bq: BigQuery, jobId: string, options: { skip: number, limit: number })`.
  - [ ] Add logic to retrieve a `Job` instance by ID.
- [ ] **Backend: Update OData Translation**
  - [ ] Implement `parseSkipToken(skiptoken: string)` to extract `jobId` and `offset`.
  - [ ] Implement `generateNextLink(baseUrl: string, jobId: string, nextOffset: number)` helper.
- [ ] **Backend: Update Result Transformer**
  - [ ] Update `ODataEnvelopeTransformer` to support an optional `nextLink` property in the `_flush` or constructor.
- [ ] **Backend: Update Route Handler (`routes/v1/index.ts`)**
  - [ ] Detect `$skiptoken` in query params.
  - [ ] If present, bypass Dry-Run and SQL translation; call `getJobResultStream` directly.
  - [ ] Calculate if a "next page" exists (e.g., if current page is full) and generate `nextLink`.
- [ ] **Frontend: Update Usage Dashboard**
  Status: done

  ## Story
  ...
  - [x] **Verification**
    - [x] Verify that clicking "Next Page" in a browser/Excel does not increase "Total Bytes Billed" in GCP Console.
    - [x] Verify that the OData response contains the correct `@odata.nextLink`.

  ### Review Findings

  - [x] [Review][Patch] JSON Injection in OData Transformer [backend/src/lib/transformers/odata-envelope.ts]
  - [x] [Review][Decision Needed] User Isolation for Job IDs [backend/src/routes/v1/index.ts] — verify if Job IDs should be tied to the current user for security.
  - [x] [Review][Patch] Job ID Parsing Collision (Underscores) [backend/src/routes/v1/index.ts] — Job IDs may contain underscores.
  - [x] [Review][Patch] Metadata Race Condition (totalRows) [backend/src/routes/v1/index.ts] — wait for job completion if needed or handle missing metadata.
  - [x] [Review][Patch] Missing Expiration Handling (getJob) [backend/src/services/bq-executor.ts] — handle expired or invalid job IDs gracefully.
  - [x] [Review][Patch] Stream Backpressure Support [backend/src/lib/transformers/odata-envelope.ts]
  - [x] [Review][Patch] Usage Transparency for Cached Hits [backend/src/routes/v1/index.ts] — record 0-byte usage for cursor-based fetches.

- **BigQuery Caching**: Query results are stored in temporary tables for 24 hours.
- **Job Results API**: Use `job.getQueryResults({ startIndex, maxResults })` or `job.getQueryResultsStream({ startIndex, maxResults })`.
- **SkipToken Format**: Recommendation: `jobId_offset` (e.g., `job_abc123_50`).
- **Default Page Size**: Default to 50 rows if not specified via `$top`.

### Paths
- Backend Service: `backend/src/services/bq-executor.ts`
- OData Transformer: `backend/src/lib/transformers/odata-envelope.ts`
- Route Handler: `backend/src/routes/v1/index.ts`

## Dev Agent Record

### Agent Model Used
Gemini 2.0 Flash

### Debug Log References

### Completion Notes List

### File List
