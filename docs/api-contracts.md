# API Contracts Documentation

This document catalogs the available API endpoints for the **odata-gateway-bq**, including OData protocol endpoints and administrative governance routes.

## OData V1 Endpoints
All OData endpoints are prefixed with `/v1/:projectId/:datasetId`.

### Service Root
`GET /v1/:projectId/:datasetId`
Returns a list of all available EntitySets (BigQuery tables/views) in the dataset.

### Metadata (CSDL)
`GET /v1/:projectId/:datasetId/$metadata`
Returns the dynamically generated OData Entity Data Model (EDM) in XML format.

### EntitySet (Data Fetch)
`GET /v1/:projectId/:datasetId/:entitySet`
The primary endpoint for fetching data.
- **Query Parameters:** Supports OData V4 filtering (`$filter`), sorting (`$orderby`), paging (`$top`, `$skip`, `$skiptoken`), selection (`$select`), navigation (`$expand`), text search (`$search`), and calculated columns (`$compute`).
- **Custom Parameters:** 
  - `?$explain=true`: Returns the generated SQL and Dry-Run cost estimate instead of the data.
- **Response:** JSON-formatted OData envelope with results streamed directly from BigQuery.

### User Consumption (Usage Hub)
`GET /v1/usage`
Returns the current user's monthly BigQuery consumption and recent job history.
- **Response:** JSON object containing `totalBytesBilled`, `budgetBytes`, and `lastJobs` array.

## Governance & Admin Endpoints

### Consumption Audit
`GET /admin/usage/:projectId/:datasetId`
Returns the total bytes processed and query count for a specific tenant.

### Cache Invalidation
`POST /admin/refresh/:projectId/:datasetId`
Clears the cached metadata (schemas) for a specific tenant, forcing a fresh crawl on the next request.

`POST /admin/refresh-all`
Clears the metadata and usage caches for all tenants.

### Dynamic Configuration
`POST /admin/config/reload`
Triggers a hot-reload of the `tenants.yaml` configuration file. Used to update scan budgets or access rules across distributed instances.

## Health & Versioning

`GET /health`
Returns the server status (`"status": "ok"`) and version information. This endpoint is public and does not require authentication.

## Authentication Requirements
All endpoints (except `/health`) require one of the following:
1. **OIDC Bearer Token:** A valid JWT in the `Authorization` header.
2. **Offloaded Headers:** When `ANONYMOUS_MODE` is active, identity is extracted from `X-Forwarded-Email`, `X-Forwarded-Groups`, and `X-Forwarded-Sub`.
