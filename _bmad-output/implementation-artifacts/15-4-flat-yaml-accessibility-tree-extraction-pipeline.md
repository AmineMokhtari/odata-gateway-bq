# Story 15.4: Flat YAML Accessibility Tree Extraction Pipeline

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an agentic model,
I want the E2E tool to generate flat YAML representations of the browser accessibility tree on disk during execution,
so that my context window consumption is minimized by 80% to 95% per action step.

## Acceptance Criteria

1. **Accessibility tree serialization using semantic roles**: Given a running browser session on the visual builder canvas, when a page loads or an action executes, the test fixture serializes the accessibility tree using semantic roles and labels. (AC: #1)
2. **Compact flat YAML representation written to disk**: The serializer outputs flat YAML (`playwright/snapshots/active-tree.yaml`) on local disk. (AC: #2)

## Tasks / Subtasks

- [x] **Author Accessibility Tree Serializer** (AC: #1, #2)
  - [x] Create target script `playwright/scripts/serialize-accessibility.cjs`.
  - [x] Implement a function that accepts Playwright's nested accessibility tree structure (from `page.accessibility.snapshot()`) and serializes it recursively.
  - [x] Strip out non-semantic or nested structural wrappers (like generic divs or layout containers with no semantic role or label) to produce a clean, flat, highly readable layout mapping.
  - [x] Map semantic properties: `role`, `name`, `value`, `description`, `keys`, `checked`, `disabled`, `expanded`.
- [x] **Disk Output & Directory Setup** (AC: #2)
  - [x] Create directory `playwright/snapshots/` under the monorepo root.
  - [x] Output serializations to `playwright/snapshots/active-tree.yaml`.
  - [x] Verify that formatting uses standard indent spacing for structural clarity.
  - [x] Ensure that `playwright/snapshots/` is also excluded in `.gitignore` to prevent leakage.

## Dev Notes

- Stripping formatting elements avoids wasting tokens on layout details.
- Source tree components to touch:
  - [NEW] `playwright/scripts/serialize-accessibility.cjs`
  - `.gitignore`

## Testing Standards

- Run the serializer against a sample JSON accessibility payload and assert that a correct flat YAML-like output is written.

### Project Structure Notes

- Minimizes model reasoning tokens dynamically during browser exploration.

### References

- Cite all details with source paths and sections:
  - [Source: planning-artifacts/architecture.md#Architectural Revision: Playwright CLI Migration (2026-05-22)]
  - [Source: planning-artifacts/epics.md#Epic 15: Playwright CLI Migration for Token Efficiency]

## Dev Agent Record

### Agent Model Used

Antigravity-v1-Developer

### Debug Log References

- Successful programmatic regression test outputting collapsed semantic YAML elements and removing generic wrappers.
- Handled empty and nested edge-case children branches correctly.

### Completion Notes List

- Created the core recursive accessibility tree serialization script `playwright/scripts/serialize-accessibility.cjs`.
- Implemented robust collapsing controls that bypass generic layouts while retaining all nested semantic properties.
- Configured monorepo git exclusion boundaries by ignoring the target local snapshots folder `playwright/snapshots/` in `.gitignore`.

### File List

- `playwright/scripts/serialize-accessibility.cjs`
- `.gitignore`

