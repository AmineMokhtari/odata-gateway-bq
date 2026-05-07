# Story 2.4: OData EDM Generation

Status: done

## Story

As a Elena (Business Analyst),
I want to see BigQuery tables as OData EntitySets,
so that I can discover data in Excel.

## Acceptance Criteria

1. **Given** a request for `$metadata` at `/v1/:projectId/:datasetId/$metadata`, **When** executed, **Then** the system returns a valid OData V4 XML/CSDL metadata document.
2. **And** BigQuery tables and views are correctly mapped to `EntitySets`.
3. **And** columns are mapped to `Property` elements with appropriate EDM types (e.g., `Edm.String`, `Edm.Int64`, `Edm.Double`, `Edm.Boolean`).
4. **And** the generated EDM is cached in the `metadataCache` (keyed by `projectId:datasetId`) to ensure subsequent discovery requests are < 500ms.
5. **And** if the cache is empty, the system automatically triggers introspection (Story 2.2) to bootstrap the EDM.

## Tasks / Subtasks

- [ ] Implement EDM Generation Logic
  - [ ] Create `src/services/odata-metadata.ts`.
  - [ ] Implement `generateEdm(metadata: DatasetMetadata)` to produce the CSDL XML.
  - [ ] Map BigQuery types to EDM types.
- [ ] Integrate with Metadata Service & Cache
  - [ ] Create `src/plugins/metadata-service.ts` or update `src/routes/v1/index.ts`.
  - [ ] Implement the "Fetch-or-Bootstrap" logic:
    1. Check `metadataCache` for cached EDM.
    2. If miss, call `getDatasetMetadata` (Story 2.2).
    3. Generate EDM.
    4. Store EDM in cache.
- [ ] Implement Metadata Route Handler
  - [ ] Update `src/routes/v1/index.ts` to handle the `/$metadata` path.
  - [ ] Set `Content-Type: application/xml`.
- [ ] Verify with Tests
  - [ ] Create `test/services/odata-metadata.test.ts`.
  - [ ] Add integration test in `test/routes/v1-data.test.ts` for the `$metadata` endpoint.

## Dev Notes

- **Architecture Compliance:** Use the `metadataCache` plugin. Ensure zero result buffering.
- **Type Mapping:** 
  - `STRING` -> `Edm.String`
  - `INT64` -> `Edm.Int64`
  - `FLOAT64` -> `Edm.Double`
  - `BOOL` -> `Edm.Boolean`
  - `TIMESTAMP` -> `Edm.DateTimeOffset`
  - `DATE` -> `Edm.Date`
- **Source Tree:**
  - `src/services/odata-metadata.ts`
  - `src/routes/v1/index.ts` (Update)

## Dev Agent Record

### Agent Model Used

gemini-2.0-flash-thinking-exp-1219 (via Gemini CLI)
