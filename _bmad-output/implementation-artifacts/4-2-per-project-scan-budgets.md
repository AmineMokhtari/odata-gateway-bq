# Story 4.2: Per-Project Scan Budgets

Status: done

## Story

As a David (Data Admin),
I want department-specific scan budgets,
so that I have granular cost control.

## Acceptance Criteria

1. **Given** a `config/tenants.yaml` file, **When** the System initializes, **Then** it loads the configuration for all active projects and datasets.
2. **And** each tenant entry defines a `scan_budget_gb` (e.g., 5, 10, 50).
3. **And** the Dry-Run Gate (Story 4.1) uses the specific `scan_budget_gb` for each request based on the `:projectId` and `:datasetId`.
4. **And** if a tenant is not defined in the config, it defaults to a global "Safe Limit" of 1GB to prevent unauthorized over-spending.

## Tasks / Subtasks

- [ ] Create Configuration Schema & File
  - [ ] Define the `tenants.yaml` format.
  - [ ] Create a sample `config/tenants.yaml`.
- [ ] Implement Tenant Configuration Loader
  - [ ] Create `src/plugins/config-loader.ts`.
  - [ ] Use `js-yaml` (need to install) to parse the configuration.
  - [ ] Decorate Fastify instance with `tenantsConfig`.
- [ ] Update Dry-Run Gate Integration
  - [ ] Update `src/routes/v1/index.ts` to look up the scan budget from `tenantsConfig`.
  - [ ] Pass the specific budget (converted to bytes) to `validateScanBudget`.
- [ ] Verify with Tests
  - [ ] Create `test/plugins/config-loader.test.ts`.
  - [ ] Update integration tests to verify different budgets for different tenants.

## Dev Notes

- **Architecture Compliance:** Use `tenants.yaml` for multi-tenant routing & access rule config.
- **Library:** Need `js-yaml`.
- **Source Tree:**
  - `src/plugins/config-loader.ts`
  - `config/tenants.yaml`

## Dev Agent Record

### Agent Model Used

gemini-2.0-flash-thinking-exp-1219 (via Gemini CLI)

