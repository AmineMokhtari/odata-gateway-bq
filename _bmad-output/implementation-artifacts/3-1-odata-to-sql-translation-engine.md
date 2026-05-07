# Story 3.1: OData-to-SQL Translation Engine

Status: done

## Story

As Elena (Business Analyst),
I want to use OData filters in Excel,
so that I don't need to write SQL.

## Acceptance Criteria

1. **Given** a standard OData V4 query (e.g., `$filter`, `$select`, `$top`, `$skip`, `$orderby`), **When** processed by the gateway, **Then** it is translated into a valid BigQuery SQL statement.
2. **And** the translation supports basic operators (`eq`, `ne`, `gt`, `ge`, `lt`, `le`, `and`, `or`).
3. **And** the translation supports `$select` to restrict columns.
4. **And** the translation supports `$top` (LIMIT) and `$skip` (OFFSET) for paging.
5. **And** the translation supports `$orderby` for sorting.

## Tasks / Subtasks

- [ ] Install OData-to-SQL library
  - [ ] `npm install odata-v4-sql`
- [ ] Implement Translation Utility
  - [ ] Create `src/lib/sql-generator.ts`.
  - [ ] Implement `translateODataToSql(table: string, query: string): string`.
  - [ ] Handle BigQuery-specific quoting (backticks).
- [ ] Verify with Unit Tests
  - [ ] Create `test/lib/sql-generator.test.ts`.
  - [ ] Test various OData query combinations and verify the generated SQL.

## Dev Notes

- **Architecture Compliance:** Use `odata-v4-sql` as the core engine.
- **Source Tree:**
  - `src/lib/sql-generator.ts`
- **GCP Compatibility:** Ensure generated SQL uses backticks for table and column names to avoid conflicts with BigQuery reserved words.

## Dev Agent Record

### Agent Model Used

gemini-2.0-flash-thinking-exp-1219 (via Gemini CLI)
