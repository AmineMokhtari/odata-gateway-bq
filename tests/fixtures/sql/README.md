# Integration Test SQL Scripts

This directory (`tests/fixtures/sql/`) is the designated location for SQL scripts used by automated tests (e.g., end-to-end integration tests). 

## Purpose
Scripts placed here are typically used by testing pipelines or test setup/teardown functions to:
- Seed a known, deterministic dataset in BigQuery before running test suites.
- Establish required schema states, Views, and Foreign Key constraints expected by the test assertions.
- Clean up or drop test databases after the suite completes.

## Usage
If you are adding a new E2E test that requires specific BigQuery data shapes, add the DDL/DML statements here and reference the `.sql` file in your test setup hooks using Node's `fs.readFileSync` combined with the `@google-cloud/bigquery` client.

*(For manual developer experimentation or ad-hoc demos, use the `scripts/sql/` directory at the project root instead).*
