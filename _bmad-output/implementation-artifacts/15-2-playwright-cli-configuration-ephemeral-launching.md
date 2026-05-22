# Story 15.2: Playwright CLI Configuration & Ephemeral Launching

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want a centralized Playwright CLI configuration file governing headless launch contexts and output paths,
so that browser processes execute headlessly and generate lightweight, predictable outputs.

## Acceptance Criteria

1. **Centralized Configuration**: A root-level configuration file `.playwright/cli.config.json` is initialized. (AC: #1)
2. **Headless Execution**: Config file enforces headless execution, default 1280x800 viewport size, 30-second network timeouts, and local trace/screenshot storage paths. (AC: #2)

## Tasks / Subtasks

- [x] **Configure Playwright CLI Parameters** (AC: #1, #2)
  - [x] Create the target directory `.playwright/` at the root of the monorepo workspace.
  - [x] Create a valid JSON configuration `.playwright/cli.config.json`.
  - [x] Populate configuration with the following strict constraints:
    - `"headless": true`
    - `"viewport": { "width": 1280, "height": 800 }`
    - `"timeout": 30000`
    - `"outputDir": "../playwright-report"`
- [x] **Validate JSON Schema and Parameters** (AC: #2)
  - [x] Programmatically verify that `.playwright/cli.config.json` is valid JSON.
  - [x] Confirm that `"headless": true` is strictly set to prevent UI window popups in containerized or background agent environments.

## Dev Notes

- **Headless Execution**: CLI execution must avoid opening browser GUIs, as this causes display connection failures in headless environments.
- **Source Tree Components to touch**:
  - [NEW] `.playwright/cli.config.json`
- **Testing Standards**:
  - Verify file exists at `.playwright/cli.config.json`.
  - Validate syntax using `node -e "JSON.parse(require('fs').readFileSync('./.playwright/cli.config.json'))"` and assert `headless === true`.

### Project Structure Notes

- Keeps all automated testing configuration separated from source files.

### References

- Cite all details with source paths and sections:
  - [Source: planning-artifacts/architecture.md#Architectural Revision: Playwright CLI Migration (2026-05-22)]
  - [Source: planning-artifacts/epics.md#Epic 15: Playwright CLI Migration for Token Efficiency]

## Dev Agent Record

### Agent Model Used

Antigravity-v1-Developer

### Debug Log References

- Execution of `node -e` validation script succeeded locally.

### Completion Notes List

- Created root-level `.playwright/` configuration directory.
- Authored the centralized browser execution config `.playwright/cli.config.json` with headless controls, viewport specifications, and output mappings.
- Validated JSON parameters via strict programmatic node assertion checks.

### File List

- `.playwright/cli.config.json`

