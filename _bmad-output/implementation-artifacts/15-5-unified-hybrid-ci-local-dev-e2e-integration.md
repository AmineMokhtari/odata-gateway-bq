# Story 15.5: Unified Hybrid CI & Local Dev E2E Integration

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a QA engineer,
I want a unified testing framework that maintains the existing playwright runner for CI regression tests while using the new `@playwright/cli` pipeline for developer agent loops,
so that our regression safety gates remain fully intact without introducing operational overhead.

## Acceptance Criteria

1. **Conditional execution routing**: In CI environments (when `CI=true` or running standard CI gates), E2E commands invoke `npx playwright test` with complete mock server setup. (AC: #1)
2. **Default local `@playwright/cli` pipelines**: For developer agent sessions, the E2E framework defaults to the `@playwright/cli` runner script, utilizing isolated credentials cache and writing accessibility trees to `playwright/snapshots/active-tree.yaml`. (AC: #2)

## Tasks / Subtasks

- [x] **Author Hybrid E2E Routing Entrypoint** (AC: #1, #2)
  - [x] Create `playwright/scripts/e2e-hybrid-router.cjs`.
  - [x] Read environment variables to detect CI status (`process.env.CI`).
  - [x] Implement spawning of either `npx playwright test` (CI branch) or `node playwright/scripts/test-agent-runner.cjs` (local/agent branch).
  - [x] Forward command arguments and process options.
- [x] **Map Primary npm Task Runner Mappings** (AC: #2)
  - [x] Register the `"test:e2e:hybrid"` script command inside `package.json` pointing to `node playwright/scripts/e2e-hybrid-router.cjs`.
  - [x] Perform programmatic validation of both routing branches.

## Dev Notes

- Ensures seamless integration in CI pipelines while maximizing developer loop speed.
- Source tree components to touch:
  - [NEW] `playwright/scripts/e2e-hybrid-router.cjs`
  - `package.json`

## Testing Standards

- Trigger `npm run test:e2e:hybrid` in standard development mode and assert it attempts local agent runner execution.
- Trigger `cross-env CI=true npm run test:e2e:hybrid` and assert it redirects to CI regression tests.

### Project Structure Notes

- Maintains identical entrypoints across environments to simplify automation and scripts management.

### References

- Cite all details with source paths and sections:
  - [Source: planning-artifacts/architecture.md#Architectural Revision: Playwright CLI Migration (2026-05-22)]
  - [Source: planning-artifacts/epics.md#Epic 15: Playwright CLI Migration for Token Efficiency]

## Dev Agent Record

### Agent Model Used

Antigravity-v1-Developer

### Debug Log References

- Successful execution redirection in local environment mode, routing to local fast agent runner.
- Successful execution redirection in CI environment mode via `cross-env CI=true`, routing to standard regression suite.

### Completion Notes List

- Created the hybrid routing entrypoint script `playwright/scripts/e2e-hybrid-router.cjs`.
- Implemented environment status detection (`process.env.CI`) to split branches gracefully.
- Configured monorepo scripts pipeline inside `package.json` mapping `"test:e2e:hybrid"` to the router script.

### File List

- `playwright/scripts/e2e-hybrid-router.cjs`
- `package.json`

