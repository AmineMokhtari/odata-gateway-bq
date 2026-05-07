# Story 3.4: OData Result Streaming Engine

Status: in-progress

## Story

As a System,
I want to stream data from BQ to HTTPS,
so that memory footprint is < 256MB.

## Acceptance Criteria

1. **Given** a running BigQuery job stream, **When** rows are received, **Then** they are transformed into OData-compliant JSON on-the-fly.
2. **And** the results are streamed directly to the client response without buffering the entire result set in memory.
3. **And** the memory footprint remains constant (O(1)) regardless of the number of rows returned.
4. **And** the response includes the `@odata.context` and a `value` array containing the results.

## Tasks / Subtasks

- [ ] Implement OData Envelope Transformer
  - [ ] Create `src/lib/transformers/odata-envelope.ts`.
  - [ ] Implement a `Transform` stream that wraps individual BigQuery rows into an OData JSON structure (`{ "value": [ ... ] }`).
- [ ] Integrate Streaming into Route Handler
  - [ ] Update `src/routes/v1/index.ts` to handle data fetch requests (e.g., `/v1/:projectId/:datasetId/:table`).
  - [ ] Use `translateODataToSql` (Story 3.1) to generate the SQL.
  - [ ] Use `createBigQueryStream` (Story 3.2) to start the job.
  - [ ] Pipe the BQ stream through the `odata-envelope` transformer directly to `reply.raw`.
- [ ] Verify with Tests
  - [ ] Create `test/lib/transformers/odata-envelope.test.ts`.
  - [ ] Add integration test in `test/routes/v1-data.test.ts` for a full data fetch request.

## Dev Notes

- **Architecture Compliance:** 100% result streaming; no buffering in the Node.js layer.
- **Source Tree:**
  - `src/lib/transformers/odata-envelope.ts`
  - `src/routes/v1/index.ts` (Update)

## Dev Agent Record

### Agent Model Used

gemini-2.0-flash-thinking-exp-1219 (via Gemini CLI)
