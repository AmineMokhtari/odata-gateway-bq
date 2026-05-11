# Story 3.3: Lossless JSON Type Casting

Status: done

## Story

As Elena (Business Analyst),
I want to see structs and arrays in Excel,
so that no data is hidden.

## Acceptance Criteria

1. **Given** a BigQuery schema containing `RECORD` (struct) or `REPEATED` (array) types, **When** SQL is generated for an OData request, **Then** the System automatically applies BigQuery's `TO_JSON_STRING()` function to those columns.
2. **And** the resulting SQL is valid and executable in BigQuery.
3. **And** the OData client receives these nested structures as valid JSON strings.

## Tasks / Subtasks

- [ ] Implement JSON Casting Logic
  - [ ] Create `src/lib/transformers/json-caster.ts`.
  - [ ] Implement a utility that takes a BigQuery table schema and a list of selected columns, and returns the columns with `TO_JSON_STRING()` applied where necessary.
- [ ] Integrate Casting into SQL Generation
  - [ ] Update `src/lib/sql-generator.ts` to accept table schema information.
  - [ ] Use the `json-caster` utility to modify the `SELECT` clause before finalizing the SQL.
- [ ] Verify with Unit Tests
  - [ ] Create `test/lib/transformers/json-caster.test.ts`.
  - [ ] Test with various schemas (flat, nested, repeated) and verify the generated SQL fragments.

## Dev Notes

- **Architecture Compliance:** Lossless fidelity through `TO_JSON_STRING`.
- **Source Tree:**
  - `src/lib/transformers/json-caster.ts`
  - `src/lib/sql-generator.ts` (Update)

## Dev Agent Record

### Agent Model Used

gemini-2.0-flash-thinking-exp-1219 (via Gemini CLI)

