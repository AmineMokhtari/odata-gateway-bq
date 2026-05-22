# Story 15.3: Ephemeral Subprocess CLI Execution Runner

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an automation agent,
I want a custom Node execution script that wraps and executes `@playwright/cli` as an isolated subprocess,
so that browser control processes run without memory leaks, port collisions, or MCP server dependencies.

## Acceptance Criteria

1. **stateless `@playwright/cli` subprocess via stdio**: Spawns a stateless `@playwright/cli` subprocess using Node's `child_process`. (AC: #1)
2. **handles inputs and outputs asynchronously**: The execution handles inputs and outputs asynchronously, returning an exit code matching the test pass/fail state. (AC: #2)

## Tasks / Subtasks

- [x] **Author Isolated Subprocess Script Wrapper** (AC: #1, #2)
  - [x] Create target node script `playwright/scripts/test-agent-runner.cjs`.
  - [x] Implement `child_process.spawn` logic wrapping `npx playwright`.
  - [x] Forward configuration arguments loaded from root `.playwright/cli.config.json` directly to the command line arguments.
  - [x] Pipe stdio streams to preserve test-run logs and error stack outputs on stdout/stderr.
- [x] **Forward Signal Terminations & Handle Lifecycle** (AC: #2)
  - [x] Forward OS signals (`SIGINT`, `SIGTERM`) from the wrapper node runner process directly to the underlying Playwright child subprocess.
  - [x] Parse child exit codes and terminate the parent wrapper script with matching exit codes.
- [x] **Register npm Wrapper Task Mapping** (AC: #2)
  - [x] Add the `"test:agent"` script command inside `package.json` pointing to `node playwright/scripts/test-agent-runner.cjs`.

## Dev Notes

- Keep the Node process extremely stateless to avoid port collision.
- Source tree components to touch:
  - [NEW] `playwright/scripts/test-agent-runner.cjs`
  - `package.json`

## Testing Standards

- Run `npm run test:agent` and verify it spawns headlessly, executes clean CLI checks, and terminates.

### Project Structure Notes

- Decouples browser automation control processes from the main application thread.

### References

- Cite all details with source paths and sections:
  - [Source: planning-artifacts/architecture.md#Architectural Revision: Playwright CLI Migration (2026-05-22)]
  - [Source: planning-artifacts/epics.md#Epic 15: Playwright CLI Migration for Token Efficiency]

## Dev Agent Record

### Agent Model Used

Antigravity-v1-Developer

### Debug Log References

- Successful execution of `npm run test:agent -- --help` outputting all Playwright parameters via the subprocess.
- Graceful handling and forwarding of standard child process error contexts.

### Completion Notes List

- Authored `playwright/scripts/test-agent-runner.cjs` CommonJS subprocess execution wrapper.
- Implemented robust dynamic configuration loading, argument forwarding, and child lifecycle/exit code mapping.
- Registered the execution mapping `"test:agent"` inside the monorepo root scripts pipeline.

### File List

- `playwright/scripts/test-agent-runner.cjs`
- `package.json`

