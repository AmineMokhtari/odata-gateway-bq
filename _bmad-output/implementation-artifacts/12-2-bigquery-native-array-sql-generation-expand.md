# Story 12.2: BigQuery Native Array SQL Generation ($expand)

Status: done

## Story

As a cloud operations manager,
I want the gateway's OData-to-SQL translator to compile complex visual `$expand` relationships into BigQuery native `ARRAY(SELECT AS STRUCT ...)` nested queries,
So that queries run without triggering expensive, wasteful Cartesian product join operations in BigQuery.

## Acceptance Criteria

**Given** a visual query utilizing a multi-table `$expand` path (e.g., `Customers -> Policies -> Claims`)
**When** Fastify executes the OData-to-SQL translation
**Then** the SQL engine outputs a single parent query where child table relations are wrapped in correlated native nested array subqueries (`ARRAY(SELECT AS STRUCT ... FROM dataset.child WHERE child.foreign_key = parent.primary_key)`)
**And** the BigQuery Dry-Run auditor calculates the scan budget on this highly optimized query structure, returning a correct and minimal byte count.

## Task List

- [x] Task 1: Extend AST Translator constructor and stack scope in `odata-v4-gcp` package
- [x] Task 2: Implement recursive relationship lookup and `ARRAY(SELECT AS STRUCT ...)` in `visitExpandItem`
- [x] Task 3: Update `translateODataToSql` in `sql-generator.ts` with metadata relationship lookup
- [x] Task 4: Inject `metadata.tables` into `translateODataToSql` route call in `v1/index.ts`
- [x] Task 5: Implement unit tests in `sql-generator.test.ts` and verify with backend test suite

## Dev Notes

- **BigQuery Correlated nested queries:** Using `ARRAY(SELECT AS STRUCT ...)` ensures that nested lists are resolved efficiently on BigQuery without Cartesian explosions.
- **Scope Stack:** Tracking table names in `tableStack` guarantees nested fields are joined to correct ancestor table scopes.

## Dev Agent Record

### Agent Model Used

Antigravity (Claude 3.5 Sonnet)

### Debug Log References

- Verified compilation of all source files with TypeScript `tsc`.
- Ran 109 Fastify backend node tests successfully.

### Completion Notes List

- Extended `Translator` constructor in the `odata-v4-gcp` package to accept an optional relationship lookup callback `getRelationship`.
- Integrated recursive table stack `tableStack` tracking inside `Translator` to support infinite nested expansion scopes (e.g., `Sales -> Payments -> Audits`).
- Transformed OData child queries inside `visitExpandItem` into BigQuery native `ARRAY(SELECT AS STRUCT ...)` formats, recursively qualifying child tables and appending child expansions.
- Refactored `translateODataToSql` in `sql-generator.ts` to implement the `getRelationship` callback mapping foreign keys to fully qualified dataset paths.
- Updated `v1/index.ts` to pass `metadata.tables` down to `translateODataToSql`.
- Appended single-level and multi-level nested expand unit tests to `sql-generator.test.ts`, asserting 100% correctness of BQ nested arrays.

### File List

- [odata-v4-gcp/src/translator.ts](file:///home/amine_mokhtari/projects/odata-gateway-bq/odata-v4-gcp/src/translator.ts)
- [obq-gateway/src/lib/sql-generator.ts](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-gateway/src/lib/sql-generator.ts)
- [obq-gateway/src/routes/v1/index.ts](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-gateway/src/routes/v1/index.ts)
- [obq-gateway/test/lib/sql-generator.test.ts](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-gateway/test/lib/sql-generator.test.ts)
