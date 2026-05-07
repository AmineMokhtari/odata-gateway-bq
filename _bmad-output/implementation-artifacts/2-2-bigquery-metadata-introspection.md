# Story 2.2: BigQuery Metadata Introspection

Status: done

## Story

As a David (Data Admin),
I want the System to crawl BigQuery `INFORMATION_SCHEMA`,
so that OData metadata is always current.

## Acceptance Criteria

1. **Given** a valid GCP Project ID and BigQuery Dataset ID, **When** triggered, **Then** the system queries `INFORMATION_SCHEMA.TABLES` and `INFORMATION_SCHEMA.COLUMNS`.
2. **And** the results are mapped into an internal "Dataset Metadata" structure containing table names and column definitions (name, type, nullable).
3. **And** the system dynamically detects the BigQuery dataset location (e.g., 'US', 'EU') to instantiate a region-aware client.
4. **And** errors (e.g., dataset not found, permission denied) are handled and logged.

## Tasks / Subtasks

- [ ] Install BigQuery client library
  - [ ] `npm install @google-cloud/bigquery`
- [ ] Create BigQuery Client Plugin (AC: 3)
  - [ ] Create `src/plugins/bq-client.ts` using `fastify-plugin`.
  - [ ] Implement a factory/decorator to provide a BigQuery client.
- [ ] Implement Introspection Logic (AC: 1, 2)
  - [ ] Create `src/services/bq-introspection.ts`.
  - [ ] Implement `getDatasetMetadata(projectId: string, datasetId: string)`:
    - [ ] Fetch dataset metadata to get the `location`.
    - [ ] Query `INFORMATION_SCHEMA.TABLES` for all tables.
    - [ ] Query `INFORMATION_SCHEMA.COLUMNS` for all columns.
- [ ] Verify with Tests (AC: 4)
  - [ ] Create `test/services/bq-introspection.test.ts` using mocks.

## Dev Notes

- **Architecture Compliance:** Use the sharded module structure. No result buffering.
- **Source Tree:**
  - `src/plugins/bq-client.ts`
  - `src/services/bq-introspection.ts`
- **GCP Labels:** Ensure user identity and correlation labels are planned for later (Story 4.4), but introspection uses master SA.

## Dev Agent Record

### Agent Model Used

gemini-2.0-flash-thinking-exp-1219 (via Gemini CLI)
