# Story 7.1: Decouple Billing Project from Data Project

Status: ready-for-dev

## Story

As a **Cloud Architect**,
I want to **configure a dedicated GCP project for BigQuery job execution**,
so that I can **separate the costs of data scanning from the projects where the raw data is stored**.

## Acceptance Criteria

1. **Configurable Execution Project**: The server must support a `BQ_BILLING_PROJECT_ID` environment variable.
2. **Cross-Project Querying**: When `BQ_BILLING_PROJECT_ID` is set, all BigQuery jobs must be submitted to that project, while the query itself targets the data project/dataset from the OData URL.
3. **Cross-Project Metadata**: Metadata discovery (CSDL generation) must correctly query the `INFORMATION_SCHEMA` of the data project, even if the billing project is different.
4. **Usage Auditing Sync**: The Usage Dashboard must reflect jobs running in the billing project.

## Tasks / Subtasks

- [ ] **Plugin: Update BQ Client Factory**
  - [ ] Implement `BQ_BILLING_PROJECT_ID` support in `bq-client.ts`.
- [ ] **Service: Update Introspection Logic**
  - [ ] Refactor `bq-introspection.ts` to accept explicit `dataProjectId`.
- [ ] **Service: Update Audit Logic**
  - [ ] Ensure `usage-audit.ts` queries the billing project logs.
- [ ] **Routes: Update Controller Context**
  - [ ] Pass correct project IDs from routes to services.
- [ ] **Verification**
  - [ ] Verify execution project in Google Cloud Console.

## Dev Notes

- **BigQuery Client**: `new BigQuery({ projectId: billingId })` sets the billing project.
- **Dataset Access**: `bq.dataset(id, { projectId: dataId })` allows cross-project metadata access.
