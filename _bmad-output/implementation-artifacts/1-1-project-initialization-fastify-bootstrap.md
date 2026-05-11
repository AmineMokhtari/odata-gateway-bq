# Story 1.1: Project Initialization & Fastify Bootstrap

Status: done

## Story

As a Developer,
I want to initialize the project using the Fastify CLI with TypeScript,
so that I have a high-performance, strictly typed foundation for the gateway.

## Acceptance Criteria

1. **Standard Structure:** Running `npx fastify-cli generate . --lang=ts` creates a standardized project structure with `package.json`, `tsconfig.json`, and `src/app.ts`.
2. **Development Mode:** Running `npm run dev` starts the server successfully on the default port.
3. **Health Check:** A `GET /health` request returns a `200 OK` response with the service status.
4. **Strict Typing:** The `tsconfig.json` is configured with `strict: true`.

## Tasks / Subtasks

- [x] Bootstrap Fastify project (AC: 1)
  - [x] Run `npx fastify-cli generate . --lang=ts`
  - [x] Run `npm install`
- [x] Configure TypeScript (AC: 4)
  - [x] Update `tsconfig.json` to ensure `strict: true` and ESM compatibility
- [x] Implement Health Route (AC: 3)
  - [x] Create `src/routes/health.ts`
  - [x] Register health route in `src/app.ts`
- [x] Verify Initialization (AC: 2)
  - [x] Run `npm run dev` and confirm server is listening
  - [x] Test `GET /health` endpoint

## Dev Notes

### Architecture Patterns & Constraints
- **Starter Foundation:** Fastify with TypeScript 5.x. [Source: _bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation]
- **Hosting:** Optimized for Google Cloud Run (scale-to-zero).
- **Naming:** Code in `camelCase`, Files in `kebab-case.ts`. [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns]

### Source Tree Components to Touch
- `package.json`
- `tsconfig.json`
- `src/app.ts`
- `src/routes/health.ts`

### Testing Standards Summary
- Native `node:test` or `vitest` for unit tests.
- 100% test coverage for critical translation logic (future stories).

### Project Structure Notes
- **Plugins:** `src/plugins/` (Metadata cache, BQ client).
- **Middleware:** `src/middleware/` (Handshake, Auditor).
- **Routes:** `src/routes/` (OData, Admin, Health).
- **Services:** `src/services/` (BQ Executor, Metadata).
- **Lib:** `src/lib/` (SQL Generator, Transformers).

### References
- [PRD: _bmad-output/planning-artifacts/prd.md]
- [Architecture: _bmad-output/planning-artifacts/architecture.md]
- [Epics: _bmad-output/planning-artifacts/epics.md]

## Latest Tech Information (2025/2026)
- **Fastify 5.x:** Optimized for TypeBox and native streaming.
- **Node.js 24+:** Support for native TypeScript execution via `--experimental-strip-types`.
- **Biome:** Recommended for 10x faster linting/formatting (consider for MVP).

## Dev Agent Record

### Agent Model Used
Gemini 2.0 Flash

### Debug Log References
- Bootstrapped using fastify-cli
- Fixed ESM compatibility issues (added import.meta.url and .js extensions)
- Verified /health endpoint returns 200 OK

### Completion Notes List
- [x] Initialized Fastify project with TypeScript
- [x] Configured strict typing and ESM mode
- [x] Implemented and verified /health route
- [x] Ensured high-performance streaming-ready foundation

### Review Findings

- [x] [Review][Patch] ESM Incompatibility in Test Script [package.json:15]
- [x] [Review][Patch] Invalid Main Entry Point [package.json:6]
- [x] [Review][Patch] Hardcoded Version in Health Check [src/routes/health.ts:4]
- [x] [Review][Patch] Missing Cloud Run Optimization (Host) [src/app.ts]
- [x] [Review][Defer] Global App Options Leakage [src/app.ts:28-40] — deferred, pre-existing Fastify CLI boilerplate



