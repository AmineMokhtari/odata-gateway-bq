# Story 12.5: Periodic Schema Validation & Orphan Relationship Pruning

Status: completed

## Story

As an administrator,
I want the 24-hour periodic schema refresh cron task to validate our `relationships.json` manifest against the active BigQuery database,
So that any relationships referencing deleted tables or columns are pruned automatically before users encounter them.

## Acceptance Criteria

1. **Given** the 24-hour cron refresh routine
2. **When** it parses the explicit `relationships.json` manifest
3. **Then** it validates that every defined table, primary key, and foreign key actively exists in BigQuery's `INFORMATION_SCHEMA.COLUMNS` view.
4. **And** if a relationship references a missing table or column, it prunes the invalid relation from the manifest, updates the cache, and writes a warning log with the correlation ID detailing the pruned orphan.

## Tasks

- [x] Task 1: Create `relationships.json` configuration file manifest.
- [x] Task 2: Update `bq-introspection.ts` `getDatasetMetadata` to load and merge manifest relationships.
- [x] Task 3: Implement validation, auto-pruning, updating manifest on disk, log warnings with correlation ID, and clearing metadata cache.
- [x] Task 4: Create admin endpoint `POST /admin/cron-refresh` and periodic background timer in Fastify gateway `index.ts`.
- [x] Task 5: Add integration tests in `v12-5-schema-validation-pruning.test.ts` and verify.
