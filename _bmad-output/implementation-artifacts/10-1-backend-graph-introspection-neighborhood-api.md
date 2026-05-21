# Story 10.1: Backend Graph Introspection (Neighborhood API)

Status: completed

## Story

As a backend developer,
I want a secure, lightweight endpoint that returns 1st-degree foreign key relationships for a specified root table by parsing our introspected dataset relationships,
so that the frontend can lazy-load the schema dynamically without transferring massive, monolithic metadata payloads.

## Acceptance Criteria

1. **Given** an authorized user session for a dataset segment `/v1/:projectId/:datasetId`
   **When** a `GET` request is made to `/v1/:projectId/:datasetId/neighborhood?table=Customers`
   **Then** the Fastify gateway returns a `200 OK` JSON response containing the table's fields (identifying partition/cluster keys) and its 1st-degree inbound/outbound relationships, limited to a maximum of 50 related nodes.
2. **Given** a request to the neighborhood endpoint
   **When** evaluated
   **Then** it does *not* trigger a direct BigQuery job if metadata is cached, but leverages the existing `fastify.metadataCache` to preserve latency, and emits a standard application-level audit log recording the user's identity.
3. **Given** a request to the neighborhood endpoint
   **When** the `table` query parameter is missing
   **Then** the endpoint returns a `400 Bad Request` with a clear validation error.
4. **Given** a request to the neighborhood endpoint
   **When** the requested `table` does not exist in the introspected dataset schema
   **Then** the endpoint returns a `404 Not Found` error.
5. **Given** a request to the neighborhood endpoint
   **When** the user does not have active authorization for the dataset (evaluated via `checkTenantAccess`)
   **Then** the endpoint returns a `403 Forbidden` response.

## Tasks / Subtasks

- [x] Task 1: Define route schema and validation rules (AC: 3)
  - [x] Implement query string parameter schema validating that `table` is present and matching `^[a-zA-Z0-9_]+$` pattern.
  - [x] Implement path params schema for `projectId` and `datasetId` identical to other `/v1` routes in `index.ts`.
- [x] Task 2: Implement authorization guard (AC: 5)
  - [x] Reuse the `checkTenantAccess` middleware pattern with `fastify.tenantsConfig.get(projectId, datasetId)`.
  - [x] Return a `403 Forbidden` if unauthorized.
- [x] Task 3: Load metadata and filter neighborhood (AC: 1, 2, 4)
  - [x] Retrieve dataset metadata from cache `fastify.metadataCache.get(cacheKey)` or introspect via `getDatasetMetadata` if not cached.
  - [x] Locate the requested `table` in `metadata.tables`. Return `404 Not Found` if missing.
  - [x] Package the table's `columns` and `relationships` (both inbound and outbound) into the simplified response payload.
  - [x] Limit relationship nodes count to 50 items max to enforce NFR performance constraints.
- [x] Task 4: Integration testing and audit logs (AC: 1, 2)
  - [x] Add standard route audit log entries using `request.log.info` detailing the request parameters and user email.
  - [x] Write integration test suite inside `obq-gateway/test/routes/` asserting positive and negative response codes.

## Dev Notes

- **Reuse Introspection Cache:** Do not invoke a new BQ crawling query on every hit. Reuse the cached `DatasetMetadata` object populated by `getDatasetMetadata(bq, datasetId, projectId)`.
- **Relationship Type Format:** The relationships are crawled bi-directionally by `bq-introspection.ts` and marked as `TO_ONE` (outbound foreign key) and `TO_MANY` (inbound reference). Ensure these types are preserved in the response for frontend rendering.
- **Paths:** Touches `obq-gateway/src/routes/v1/index.ts`.
- **Test File:** Write tests in a new file `obq-gateway/test/routes/neighborhood.test.ts` or add to `v1-advanced.test.ts`.

### Project Structure Notes

- **Gateway Service Pattern:** Fits directly within the Fastify Router v1 plugin structure located in `obq-gateway/src/routes/v1/index.ts`.
- **Response Shape Recommendation:**
  ```json
  {
    "table": "Customers",
    "partitionColumn": "created_date",
    "requiresPartitionFilter": false,
    "columns": [
      { "name": "id", "type": "INT64", "isNullable": false },
      { "name": "name", "type": "STRING", "isNullable": true }
    ],
    "relationships": [
      {
        "name": "FK_Customers_Policies",
        "column": "id",
        "referencedTable": "Policies",
        "referencedColumn": "customer_id",
        "type": "TO_MANY"
      }
    ]
  }
  ```

### References

- [Source: obq-gateway/src/services/bq-introspection.ts#L56-L218] (introspecting metadata)
- [Source: obq-gateway/src/routes/v1/index.ts#L68-L114] (standard v1 authorization pattern)

## Dev Agent Record

### Agent Model Used

Antigravity

### Debug Log References

- Fastify router initialization and compilation successfully completed.
- Integration tests ran using standard test harness with 107/107 passing checks.

### Completion Notes List

- Added `GET /v1/:projectId/:datasetId/neighborhood` route inside `obq-gateway/src/routes/v1/index.ts`.
- Fully integrated with `checkTenantAccess` authorization check, `fastify.metadataCache` check, and filtered bi-directional relationships with 50-limit capping and ghost table validation.
- Created robust suite of integration tests inside `obq-gateway/test/routes/neighborhood.test.ts` asserting all route scenarios.

### File List

- [obq-gateway/src/routes/v1/index.ts](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-gateway/src/routes/v1/index.ts)
- [obq-gateway/test/routes/neighborhood.test.ts](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-gateway/test/routes/neighborhood.test.ts)
