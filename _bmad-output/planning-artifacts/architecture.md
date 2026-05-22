---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments: ['_bmad-output/planning-artifacts/prd.md', '_bmad-output/brainstorming/brainstorming-session-2026-04-23-16-30.md']
workflowType: 'architecture'
project_name: 'odata-gateway-bq'
user_name: 'Amine_mokhtari'
date: '2026-05-13'
lastStep: 8
status: 'complete'
completedAt: '2026-05-19'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
The system must act as a production-grade OData V4 gateway for BigQuery. Architecturally, this requires a request pipeline that intercepts and verifies OIDC tokens, authorizes requests via internal rules, validates the query cost via a BigQuery Dry Run, and streams results while performing on-the-fly type casting for nested data. BigQuery access is performed via a secure master service account (Trusted Subsystem).

**Non-Functional Requirements:**
Performance is critical, with discovery latency targets of < 2s. Security is paramount, requiring verified identities and TLS 1.3 enforcement. Reliability and Scalability goals (99.9% uptime, 100+ concurrent tenants) demand a stateless, sharded architecture.

**Scale & Complexity:**
The project operates in a high-stakes enterprise analytics domain. The real-time cost enforcement and multi-tenant isolation introduce high architectural complexity.

- Primary domain: API Gateway / Data Infrastructure
- Complexity level: High (Enterprise)
- Estimated architectural components: 5-7 (Routing, Auth verification, Metadata Manager, SQL Generator, Cost Auditor, Streaming Engine)

### Technical Constraints & Dependencies

- **GCP IAM & BigQuery:** Strict dependency on GCP's native APIs and quota systems.
- **OIDC/Entra ID:** Dependency on corporate identity providers for initial identity verification.
- **odata-v4-sql:** Core dependency for OData-to-SQL translation.
- **Technology-Agnostic Execution:** Requirements mandate "The System" be implementation-ready for high-performance Node.js/TypeScript deployment.

### Cross-Cutting Concerns Identified

- **Identity Verification:** verifying the OIDC token across all data requests.
- **Cost Circuit Breaker:** Ensuring every data path is gated by the Dry-Run auditor.
- **Tenant Isolation:** Preventing metadata and data "bleed" across sharded URL paths.
- **Audit Integrity:** Decorating every BigQuery job with immutable user identity and correlation labels.

## Starter Template Evaluation

### Primary Technology Domain

API Backend / Data Gateway based on project requirements analysis.

### Starter Options Considered

- **Fastify (TypeScript):** High-performance, streaming-first, excellent middleware ecosystem. **[Recommended]**
- **Express (TypeScript):** Ubiquitous, easy to find talent, but requires more manual plumbing for streaming and high-concurrency OData paths.
- **NestJS:** Robust, modular, but introduces high abstraction overhead which may conflict with our "Thin Proxy" goals.

### Selected Starter: Fastify (TypeScript)

**Rationale for Selection:**
Fastify's focus on performance and native support for asynchronous streams directly supports our NFRs for low latency and near-zero memory footprint. Its plugin architecture is ideal for sharding multi-tenant OData metadata caches.

**Initialization Command:**

```bash
# Using Fastify CLI for a standardized TypeScript structure
npx fastify-cli generate . --lang=ts
npm install
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
Node.js with TypeScript 5.x, utilizing strict type checking and `ESModules`.

**Build Tooling:**
`fastify-cli` provides a standardized build and development lifecycle, utilizing `tsx` for sub-second hot-reloads.

**Testing Framework:**
Pre-configured with a test runner (Vitest or Tap) suitable for validating OData-to-SQL translation logic.

**Code Organization:**
Standardized `plugins/`, `routes/`, and `services/` structure, promoting a stateless and modular design.

**Development Experience:**
Built-in support for environment variables (`dotenv`), structured logging (`pino`), and schema validation.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- **Starter Foundation:** Fastify with TypeScript 5.x.
- **Data Execution:** Transform stream pipeline for on-the-fly OData formatting.
- **UX Foundation:** Zustand for global state management (Project Switcher).

**Important Decisions (Shape Architecture):**
- **Metadata Management:** Sharded in-memory LRU cache isolated by tenant-URL.
- **Hosting Strategy:** Google Cloud Run (Fully managed, serverless).
- **Core Translation:** `odata-v4-sql` for SQL generation.
- **Advice Engine:** Backend Middleware to generate "Elena's Tips" from BQ errors.
- **Identity Propagation:** Server-to-Client prop injection for non-public environment variables (Security Boundary).

**Deferred Decisions (Post-MVP):**
- **Redis Integration:** Deferred until horizontal scaling requires cross-instance cache persistence.
- **GKE Deployment:** Deferred unless specific networking/control requirements emerge.

### Data Architecture

**Metadata Caching Strategy:**
- **Decision:** In-Memory LRU Cache.
- **Version:** `lru-cache` v10+.
- **Rationale:** Ensures metadata responses meet the < 2s target with near-zero infrastructure overhead. Sharding by tenant-URL prevents cross-tenant metadata bleed.
- **Affects:** Metadata Discovery Service, Tenant Isolation Logic.

**Streaming & Transformation:**
- **Decision:** Node.js Transform Stream Pipeline.
- **Rationale:** Crucial for maintaining the < 256MB memory footprint. Each row is processed individually: BigQuery Row → JSON Transformer → OData Envelope → Response Stream.
- **Affects:** Data Fetching Service, Result Formatting.

**Cost Estimation (Pulse Badge):**
- **Decision:** Dedicated Dry-Run Endpoint (`/v1/:projectId/dry-run`).
- **Rationale:** Provides real-time, accurate byte-count estimation for the UI using the native BQ `dryRun` flag.
- **Affects:** Frontend URL Builder, BQ Client Service.

### Authentication & Security

**Security Guardrails:**
- **Decision:** Dry-Run Interceptor.
- **Rationale:** Mandatory pre-flight query to enforce enterprise scan budgets before BigQuery execution.
- **Affects:** SQL Generation, Execution Pipeline.

**Advice Translation (Elena's Tips):**
- **Decision:** Backend Error Decorator (Fastify Plugin).
- **Rationale:** Intercepts 403/429/500 errors and decorates response with an `elena_tip` field containing actionable advice.
- **Affects:** Error Handler, Gateway Middleware.

### Infrastructure & Deployment

**Hosting Platform:**
- **Decision:** Google Cloud Run.
- **Rationale:** Provides the best balance of cost (scale-to-zero) and performance for a stateless proxy. Native integration with GCP IAM and application default credentials.
- **Affects:** CI/CD Pipeline, Deployment Strategy.

### Frontend Architecture

**Global State Management:**
- **Decision:** Zustand.
- **Rationale:** High-performance, lightweight state management for the Project Switcher and global Drawer states (Elena, URL Builder). Elena's Drawer is triggered reactively when the OData Gateway returns an `elena_tip` metadata field.
- **Affects:** All UI Components.

**UI Component Library:**
- **Decision:** Shadcn/UI + Tailwind CSS.
- **Rationale:** Rapid development of Google Cloud Console-like components with standard MD3 tokens.

### Decision Impact Analysis

**Implementation Sequence:**
1. **Bootstrap Foundation:** Initialize Fastify with TypeScript + Zustand.
2. **Auth verification:** Implement OIDC verification plugin.
3. **Metadata Service:** Implement sharded schema caching.
4. **Dry-Run API:** Implement the `/dry-run` endpoint for the Pulse Badge.
5. **Advice Engine:** Implement the "Elena's Tips" error decorator.
6. **Data Pipeline:** Implement streaming SQL execution with Dry-Run gating.

**Cross-Component Dependencies:**
The **Cost Auditor** depends on the **SQL Generator's** output. The **Data Fetcher** depends on the **Auth plugin** providing a verified user identity. The **Metadata Service** must be tenant-aware to support the **URL Routing** segment.

## Implementation Patterns & Consistency Rules

### Naming Patterns

**API & OData Naming:**
- **URL Parameters:** `:projectId`, `:datasetId` (camelCase).
- **OData Entities:** PascalCase (mapped 1:1 from BigQuery tables).
- **Query Parameters:** Standard OData (`$filter`, `$top`, etc.).

**Frontend Naming:**
- **Component Files:** `PascalCase.tsx` (e.g., `ProjectSwitcher.tsx`).
- **State Hooks (Zustand):** `use[Domain]Store` (e.g., `useProjectStore`).
- **Icons:** Standardize on **Lucide React** (GCP-mirroring choices).

**Code Naming Conventions:**
- **Variables & Functions:** `camelCase` (e.g., `generateSql`).
- **Classes & Types:** `PascalCase` (e.g., `MetadataCache`).
- **Files:** `kebab-case.ts` (backend) and `PascalCase.tsx` (frontend).

### Structure Patterns

**Project Organization:**
- **`src/store/`:** Zustand global state stores.
- **`src/components/`:** Shadcn/UI and custom Google Cloud-style components.
- **`src/plugins/`:** Backend Fastify plugins (Auth, Metadata, Elena Tips).
- **`src/routes/`:** OData data and `/dry-run` endpoints.

### Format Patterns

**"Elena's Tips" Payload:**
The gateway decorates BQ errors with an `elena_tip` object:
```json
{
  "error": { "code": "BudgetExceeded", "message": "..." },
  "elena_tip": {
    "advice": "Try filtering by date...",
    "quick_fixes": [{ "label": "Last 7 Days", "filter": "CreatedAt ge ..." }]
  }
}
```

**Pulse Badge Exchange:**
Standard safety signal returned by the `/dry-run` endpoint:
```json
{
  "byte_count": 12582912,
  "cost_estimate_usd": 0.006,
  "safety_status": "safe",
  "remaining_budget_pct": 94.2
}
```

### Process Patterns

**The Reactive UI Flow:**
All query-building interactions follow this reactive pattern:
1. **User Action**: Change an OData parameter.
2. **Debounced Audit**: UI waits 500ms, then calls `/dry-run`.
3. **Badge Update**: Pulse Badge updates based on `safety_status`.
4. **Elena Intercept**: On error, the Elena Tips Drawer automatically opens with the advice payload.

### Enforcement Guidelines

**All AI Agents MUST:**
- Use `pino` for all logging, including the `correlation_id`.
- Never buffer result sets; use strictly streaming pipelines.
- Ensure all "Elena Tips" are actionable (include at least one `quick_fix`).

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
odata-gateway-bq/
├── src/
│   ├── backend/                 # Core OData Proxy Logic
│   │   ├── plugins/
│   │   │   ├── auth.ts          # OIDC Verification
│   │   │   ├── elena-tips.ts    # [NEW] Error Advice Engine
│   │   │   └── metadata-cache.ts
│   │   ├── routes/
│   │   │   ├── v1/
│   │   │   │   ├── data.ts
│   │   │   │   └── dry-run.ts   # Pulse Badge API
│   │   │   └── health.ts
│   │   └── services/
│   │       ├── bq-executor.ts
│   │       └── odata-metadata.ts
│   ├── frontend/                # Next.js Catalog Portal
│   │   ├── src/
│   │   │   ├── app/             # App Router (layout.tsx, page.tsx)
│   │   │   ├── components/
│   │   │   │   ├── layout/      # Navigation, TopBar
│   │   │   │   ├── Catalog/ # Data Grid, Dataset Cards
│   │   │   │   └── drawers/     # URL Builder, Elena Drawer
│   │   │   ├── store/           # Zustand Stores (project-store.ts)
│   │   │   ├── hooks/           # useDryRun.ts (Audit Logic)
│   │   │   └── package.json
│   │   └── package.json
│   └── shared/                  # Common Types & Schemas
│       └── elena-payload.ts     # Tip/Advice JSON Schema
├── config/
│   └── elena-rules.yaml         # Advice mapping rules (prose & fixes)
├── package.json
└── docker-compose.yml           # Backend + Frontend dev setup
```

### Architectural Boundaries

**API Boundaries:**
The primary boundary is the **URL-Based Tenant Segment** (`/v1/:projectId`). The Frontend `useDryRun` hook calls the Backend `/dry-run` endpoint as the user interacts with the URL Builder.

**Component Boundaries:**
- **Frontend State**: Managed in Zustand (`useProjectStore`). This is the "Project Switcher" source of truth.
- **Advice Flow**: Any backend error is decorated by the `elena-tips.ts` plugin with advice metadata before being returned to the UI.

### Requirements to Structure Mapping

**Feature Mapping:**
- **Catalog Discovery**: `src/frontend/components/Catalog/`
- **Cost Awareness (Pulse Badge)**: `src/backend/routes/v1/dry-run.ts` + `src/frontend/hooks/useDryRun.ts`
- **Elena's Guidance**: `src/backend/plugins/elena-tips.ts` + `src/frontend/components/drawers/ElenaDrawer.tsx`

### Integration Points (Revised: Hybrid Model)

**Data Flow:**
1. **User Action**: Change an OData parameter in the UI.
2. **Audit (Frontend)**: Hook calls a **Next.js Server Action**.
3. **Gateway Client (Next.js Server)**: The action uses `lib/gateway-client.ts` to forward the request to Fastify, including browser cookies.
4. **Audit (Backend)**: BQ Dry-Run executed via `bq-executor.ts` in Fastify.
5. **Signal (Frontend)**: Pulse Badge updates color based on safety status.
6. **Advice (Backend)**: If audit fails, Elena plugin decorates the error; Fastify returns it to the Server Action.
7. **Guidance (Frontend)**: Server Action returns the decorated error to the UI; Elena Drawer opens.

**Direct Streaming (External Tools):**
1. **Tool Action**: Excel/PowerBI sends a GET request to the **Fastify Public Data URL**.
2. **Identity**: Fastify verifies the session cookie natively.
3. **Stream**: Data is streamed directly from BigQuery to the tool, bypassing Next.js.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
The combination of **Fastify (Backend)** and **Zustand/React (Frontend)** is highly compatible. Serving the Vite build via the Fastify server simplifies deployment to a single **Cloud Run** service and eliminates CORS complexity.

**Pattern Consistency:**
The "Reactive UI Flow" (Debounced Audit -> Pulse Badge update) aligns perfectly with the "Stateless Proxy" nature of the backend.

**Structure Alignment:**
The new `src/backend` and `src/frontend` separation provides clear ownership while the `src/shared` directory ensures type safety for the "Elena" payloads.

### Requirements Coverage Validation ✅

**Feature Coverage:**
- **Catalog Discovery**: Fully supported by sharded metadata plugin.
- **Cost Awareness**: Supported by `/dry-run` endpoint.
- **Elena's Guidance**: Supported by backend error decoration.

**Non-Functional Requirements Coverage:**
Performance targets (< 2s) are maintained through LRU caching. The < 256MB footprint is secured by the backend's streaming pipeline and the frontend's lightweight Zustand state.

### Implementation Readiness Validation ✅

**Decision Completeness:**
All critical decisions (Zustand state, Dry-Run API, Elena Payload) are documented with rationales.

**Structure Completeness:**
The project tree is specific, mapping UX components to frontend directories and advice logic to backend plugins.

### Gap Analysis Results

**Important Gaps:**
- **Deployment Logic**: The Vite frontend must be built and served via `@fastify/static` from the backend to maintain a single deployment unit.
- **Advice Rule Management**: The `elena-rules.yaml` schema must be strictly defined to allow non-technical prose updates.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**✅ Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- **Zero-Trust UI**: The UI interacts only with the sharded gateway.
- **Actionable Errors**: "Elena's Tips" turn technical failures into user progress.
- **Native Experience**: Styling follows Google Cloud Console's MD3 spec.

---

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented.
- Use the **"Reactive UI Flow"** pattern for all query interactions.
- Ensure 100% result streaming; never buffer data in the Node.js layer.

**First Implementation Priority:**
```bash
# 1. Initialize Fastify Backend
npx fastify-cli generate src/backend --lang=ts
# 2. Initialize Vite Frontend
cd src/frontend && npx create-vite . --template react-ts
```

## Architectural Revision: Hybrid & Centric-Auth (2026-05-13)

### Decision Priority Analysis

**Critical Decisions:**
- **Hybrid Communication Model**: Next.js Server Actions handle UI metadata/audit logic; Fastify handles direct OData streaming for external tools (Excel/PowerBI).
- **Fastify-Centric Authentication**: All OIDC and session management is centralized in the Fastify backend.
- **Transparent Cookie Proxy**: Next.js acts as a stateless forwarder, passing cookies from the browser to Fastify and propagating `Set-Cookie` responses back to the client.

**Important Decisions:**
- **Dedicated Data Endpoint**: Fastify is exposed via a dedicated public URL for high-performance, unbuffered OData streaming.
- **Centralized Gateway Client**: `lib/gateway-client.ts` implements the cookie-forwarding and retry logic for all Server Actions.

### API & Communication Patterns

- **UI Passthrough (Server Actions)**:
    - **Logic**: Actions use the `gatewayClient` to fetch from Fastify.
    - **Header Propagation**: The client must manually forward the `Cookie` header and propagate `Set-Cookie` headers to maintain the session.
- **Direct Data Path (Fastify)**:
    - **Mechanism**: Direct GET requests from external tools.
    - **Authentication**: Fastify validates cookies/tokens natively.

### Decision Impact Analysis

**Implementation Sequence:**
1. **Core Client**: Implement `gateway-client.ts` with header propagation.
2. **Metadata Migration**: Move catalog and explain logic to Server Actions.
3. **Infrastructure**: Expose Fastify on a public data endpoint.


## Implementation Patterns & Consistency Rules (Revision: 2026-05-13)

### Naming Patterns

**Server Actions:**
- **Location**: `src/app/actions/[domain].ts` (e.g., `odata.ts`, `tenants.ts`).
- **Convention**: `[verb][Subject]Action` (e.g., `auditQueryAction`).
- **Rationale**: Ensures clear separation from client-side hooks and internal utilities.

**Gateway Client:**
- **Location**: `src/lib/gateway-client.ts`.
- **Pattern**: Functional wrapper using the native `fetch` API.

### Format Patterns

**The Advice-Enriched Union (ActionResult):**
All Server Actions must return a consistent discriminated union that carries the **Elena Advice Layer**:
```typescript
export type ActionResult<T> = {
  elena_tip?: ElenaTip; // Guidance available on both success (warnings) and failure (errors)
} & (
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }
);
```

### Process Patterns

**Transparent Cookie Handshake:**
1. **Request**: `gatewayClient` pulls cookies from `next/headers` and forwards them to Fastify.
2. **Response**: If Fastify returns a `Set-Cookie` header (e.g., after a token refresh), the `gatewayClient` must use the Next.js `cookies().set()` API to propagate the update back to the browser.
3. **Traceability**: Every request must inject a `x-correlation-id` header derived from the parent Next.js request.

**Error Mapping Flow:**
- **Backend**: Fastify plugin (`elena-tips.ts`) decorates raw BigQuery/Auth errors with `elena_tip` metadata.
- **BFF**: Next.js Server Action captures the decorated error and returns it via the `ActionResult` type.
- **Frontend**: Component checks `!result.success` and passes `result.elena_tip` to the `ElenaDrawer`.

### Enforcement Guidelines

**All AI Agents MUST:**
- Use the `gatewayClient` for ALL communication with the Fastify backend.
- Never return raw `fetch` responses from a Server Action.

## Project Structure & Boundaries (Revision: 2026-05-13)

### Complete Project Directory Structure (Hybrid Model)

```text
odata-gateway-bq/
├── backend/                     # THE DATA SOURCE (Fastify)
│   ├── src/
│   │   ├── plugins/
│   │   │   ├── auth.ts          # Master OIDC Client & Session Logic
│   │   │   └── elena-tips.ts    # Error Decoration Engine
│   │   └── routes/v1/
│   │       ├── data.ts          # DIRECT STREAMING (Public)
│   │       └── audit.ts         # Internal Private Audit API (used by Actions)
└── frontend/                    # THE UI GATEWAY (Next.js)
    ├── src/
    │   ├── app/
    │   │   ├── actions/         # UI BACKEND (Server Actions)
    │   │   │   ├── odata.ts     # Metadata & Audit passthrough
    │   │   │   └── tenants.ts   # Catalog discovery
    │   ├── lib/
    │   │   └── gateway-client.ts # Cookie-forwarding Fetch Wrapper
```

### Architectural Boundaries

**API Boundaries:**
- **Management Endpoint (Internal)**: Next.js Server Actions communicate with Fastify's `/v1/audit` and `/v1/metadata` endpoints via a private network path.
- **Streaming Endpoint (Public)**: Fastify exposes `/v1/data` directly for external OData consumption (Excel/PowerBI).

**Authentication Boundaries:**
- **Primary Auth Provider**: Fastify handles all OIDC redirects and token exchanges.
- **Session Bridge**: The browser stores the Fastify session cookie. Next.js Server Actions act as a "Transparent Proxy," forwarding this cookie to authorize backend calls.

**Data Flow (Revised):**
1. **User Action**: Change query in UI.
2. **Management Call**: UI triggers `auditQueryAction`.
3. **Passthrough**: `gateway-client.ts` forwards cookies to Fastify's `/audit` path.
4. **Execution**: Fastify runs Dry-Run and returns decorated results (Elena Tips).
5. **Streaming**: For actual data retrieval, the UI provides the user with the direct Fastify URL.
- Ensure that `elena_tip` metadata is never stripped or ignored during the passthrough.

## Architectural Revision: Epic 9 Hardening (2026-05-16)

### Decision Priority Analysis

**Critical Decisions:**
- **Strict Server-Centric Metadata**: All metadata discovery (CSDL, Service Root, Connection Status) must route through Next.js Server Actions. Direct client-side calls to the Fastify gateway for metadata are strictly prohibited.
- **Bi-directional Relationship Discovery**: The metadata manager must crawl both Inbound and Outbound Foreign Keys to support 1:N expansions.
- **Identity-Job Security Boundary**: BigQuery Jobs must be strictly isolated by `user_identity` labels. The gateway must verify the identity on every result resumption request.

**Important Decisions:**
- **Server-Side XML Parsing**: Use `fast-xml-parser` in Server Actions to process CSDL metadata, avoiding dependency on browser-native APIs.
- **BigQuery Nested Structs (1:N)**: Leverage `ARRAY(SELECT AS STRUCT ...)` for OData expansions that map to 1:N relationships.

### Data Architecture (Revision: 2026-05-16)

**1:N Expansion Pattern:**
- **Logic**: If a navigation property represents a "Collection", the generator creates a correlated subquery.
- **Type Mapping**: Navigation properties are wrapped in `Collection(Type)` in the EDM.

**Security Isolation Pattern:**
- **Logic**: Every Job ID is tagged with the user's verified identity.
- **Verification**: On resumption via `$skiptoken`, the gateway checks the job's `user_identity` label against the requester's session.

## Architectural Revision: Visual Query Builder (2026-05-19)

### Frontend Architecture (Graph Rendering)
- **Decision:** React Flow (v11+) + Dagre + Interactive Query Summary
- **Rationale:** React Flow provides the core interactive canvas, with `dagre` acting as an auto-layout engine for lazy-loaded nodes. 
- **Layout Pinning & Offloading:** Existing nodes are pinned during lazy re-fetches to prevent jarring canvas jumps. To ensure the UI remains perfectly fluid, the mathematically expensive `dagre` calculations are offloaded to a **Web Worker**, preventing the main thread from blocking on complex graphs.
- **Navigation & Accessibility:** The implementation mandates the use of React Flow's `<MiniMap>` and `<Controls>` plugins, alongside explicit keyboard navigation support.
- **Cost-Aware Custom Nodes:** Custom node components will visually highlight BigQuery partition and cluster keys with badges, proactively guiding users to write cost-effective queries before the Dry-Run auditor executes.
- **Interactive Visibility:** A persistent "Query Summary" sidebar ensures users never lose track of their query when the canvas auto-prunes. Clicking a pruned node in the sidebar triggers a "re-center and lazy re-fetch".

### State Management (Visual Query Builder)
- **Decision:** Zustand Graph Store with Strict Visual/Logical State Separation
- **Rationale:** The store separates `visual_nodes` (what React Flow draws) from `selected_paths` (the actual OData query). 
- **Memory Protection:** The store enforces a soft limit of 200 `visual_nodes`, using an LRU algorithm to silently fade out the oldest unselected nodes without touching the `selected_paths` array.
- **Global Actions & Binding:** The Pulse Badge (Cost Estimator) and global actions (e.g., "Clear Canvas") are strictly bound to the Logical State (`selected_paths`).
- **Resilience & Shareability:** The `selected_paths` logical state is strictly serialized to the URL query parameters. This makes queries bookmarkable, shareable, and ensures work is not lost if an OIDC token expires and forces a login redirect.

### Data Architecture & SQL Generation
- **Decision:** BigQuery Native Array Subqueries for `$expand` Translation
- **Rationale:** Standard OData-to-SQL translation resolves `$expand` clauses via `LEFT JOIN` chains, which trigger massive Cartesian product explosions in BigQuery. The Fastify SQL Generator service is mandated to rewrite deep OData `$expand` parameters into BigQuery's native `ARRAY(SELECT AS STRUCT ...)` nested queries.
- **Cost Accuracy:** This approach guarantees one row per parent record, eliminating Cartesian explosion costs and ensuring that the Dry-Run auditor calculates an exact, minimal byte count for the Pulse Badge.

### Performance & Constraint Mitigations
- **Decision:** Backend-Enforced "Neighborhood View" API with Schema Verification
- **Rationale:** To enforce the `< 3s` render latency NFR, the Fastify backend exposes a dedicated `/v1/metadata/neighborhood?table=X` endpoint. 
- **Network Resilience:** The gateway client enforces a strict 5-second `AbortSignal` timeout on all lazy-fetches, gracefully aborting and notifying the user via Toast if the network hangs, preventing indefinite skeleton loading states.
- **Consistency Guardrail:** Every response includes a `schema_version` hash. A hash mismatch triggers a canvas reset accompanied by a globally visible Toast Notification explaining the schema change.
- **Permission Guardrail:** If a user opens a shared URL containing tables they do not have IAM permissions for, the backend will return a 403 Forbidden during the initial `/dry-run` audit. The **Elena Tips** engine will intercept this and prompt the user to automatically prune the unauthorized tables, rather than crashing the UI.

### Accessibility (a11y) & Theming
- **Decision:** Screen-Reader Alternative Routing & Semantic CSS Variables
- **Rationale:** A 2D spatial graph is inherently inaccessible to visually impaired users. The React Flow canvas will be marked with `aria-hidden="true"`, and screen reader focus will be routed to the text-based Query Summary Sidebar, which serves as a fully functional `aria-live` alternative query builder.
- **Theming Contract:** To ensure WCAG contrast compliance across Light and Dark modes, all custom nodes and BigQuery partition badges must strictly utilize semantic CSS variables rather than hardcoded hex colors.

### Quality Assurance, Testing & Observability
- **Decision:** Playwright E2E Fixtures + Deterministic UI Instrumentation
- **Rationale:** The highly dynamic nature of the lazy-loaded canvas requires real browser environments to test correctly. Playwright will explicitly mock edge cases like `schema_version` mismatches and 403 IAM failures to ensure the frontend reset/recovery logic works perfectly. 
- **Testing Instrumentation:** All custom React Flow nodes and edge handles must be injected with explicit `data-testid` attributes to prevent flaky coordinate-based click tests.
- **Observability:** To debug complex canvas crashes in production, the `<InteractiveErd>` component is wrapped in an Error Boundary. Upon an unhandled crash, it captures the exact Zustand state (`visual_nodes`, `selected_paths`) and attaches it to the observability payload for local developer replay. A scrubbing function replaces sensitive schema strings with generic hashes to ensure proprietary structures remain secure.

### Telemetry & Day-2 Operations
- **Decision:** Asynchronous Batched Telemetry via `navigator.sendBeacon`
- **Rationale:** To monitor the success and usability of the visual query builder without degrading performance, Zustand maintains an `event_queue`. Interaction events are batched and silently flushed to a dedicated, lightweight `/v1/telemetry` Fastify endpoint, guaranteeing zero impact on the primary visual rendering thread.

## Implementation Patterns & Consistency Rules (Visual Query Builder)

### Pattern Categories Defined

**Critical Conflict Points Identified:**
5 areas where AI agents could make different choices (Naming, Structure, Formats, Communication, Process) regarding the new React Flow canvas, Zustand state, and Web Workers.

### Naming Patterns

**Code Naming Conventions:**
- **Server Actions:** MUST use `camelCase` and end with `Action` (e.g., `executeDryRunAction`).
- **Zustand Stores:** MUST use the `use[Domain]Store` hook pattern (e.g., `useVisualQueryStore`).
- **Fastify Files:** MUST use `kebab-case.ts` (e.g., `neighborhood-api.ts`).
- **React Flow Nodes:** Components use `PascalCase.tsx` (e.g., `BqTableNode.tsx`), but the React Flow `type` string MUST use `kebab-case` (e.g., `type: 'bq-table-node'`).

### Structure Patterns

**Project Organization:**
- **Web Workers:** The Dagre layout offloading logic MUST be placed in `obq-hub/src/lib/workers/` and use the `.worker.ts` suffix (e.g., `dagre-layout.worker.ts`).
- **End-to-End Tests:** All Playwright UI tests MUST be isolated in `/e2e/` at the project root, completely decoupled from `src/` unit tests.
- **Shared Types:** Payload definitions for Telemetry and the Neighborhood API MUST be placed in `common/src/types/` so both Fastify and Next.js can import them.

### Format Patterns

**Data Exchange Formats:**
- **Telemetry Payloads:** MUST follow a strictly typed discriminated union format to allow the backend to parse them efficiently: 
  `{ event_type: 'node_expanded' | 'lru_pruning', payload: any, timestamp_ms: number }`
- **OData URL Construction:** Agents MUST use a dedicated utility class/builder (e.g., `ODataUrlBuilder`) rather than raw string concatenation for `$expand` paths to prevent malformed URI encoding.

### Communication Patterns

**State Management Patterns:**
- **Visual vs Logical State:** Zustand actions MUST explicitly name their target. Actions modifying React Flow use `visualNode*` (e.g., `addVisualNode`), while actions modifying the query use `logicalPath*` (e.g., `addLogicalPath`).

### Process Patterns

**Loading State Management:**
- **Explicit Enumerations:** Zustand stores and React components MUST use explicit status strings (`status: 'idle' | 'loading' | 'success' | 'error'`) rather than generic boolean flags (`isLoading: true`). This prevents race conditions when rapid lazy-fetching occurs.

**Error Handling Patterns:**
- **Safe Server Actions:** Next.js Server Actions MUST NEVER throw raw exceptions to the client components. They must catch all errors (including Fastify 403s or 500s) and return the standardized `ActionResult<T>` discriminated union, allowing the UI to render the `elena_tip` gracefully.

### Enforcement Guidelines

**All AI Agents MUST:**
- Inject `data-testid` attributes on all interactive React Flow nodes and `<Handle>` components.
- Execute `dagre` layout calculations ONLY within the designated Web Worker in `obq-hub`.
- Read from `visual_nodes` for UI rendering, but read from `selected_paths` for Pulse Badge cost estimation.

### Pattern Examples

**Good Examples:**
```typescript
// Good: Safe Server Action returning standard union
export async function fetchNeighborhoodAction(table: string): Promise<ActionResult<Neighborhood>> {
  try {
    const data = await gatewayClient.get(`/v1/metadata/neighborhood?table=${table}`);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error), elena_tip: extractTip(error) };
  }
}
```

**Anti-Patterns:**
```typescript
// BAD: Throwing raw errors to UI components breaks React Boundaries
export async function fetchNeighborhoodAction(table: string) {
  const response = await fetch(`...`);
  if (!response.ok) throw new Error("Failed to fetch"); // VIOLATION
  return response.json();
}

// BAD: String concatenation for complex OData paths
const url = `$expand=${parent}($expand=${child})`; // VIOLATION
```

## Project Structure & Boundaries (Visual Query Builder)

### Complete Project Directory Structure

```text
odata-gateway-bq/
├── obq-gateway/                 # THE DATA SOURCE (Fastify)
│   ├── src/
│   │   ├── plugins/
│   │   │   ├── auth.ts          # OIDC Client & Session Logic
│   │   │   └── elena-tips.ts    # Error Decoration Engine
│   │   ├── routes/v1/
│   │   │   ├── audit.ts         # BQ Dry-Run execution
│   │   │   ├── data.ts          # Public streaming endpoint
│   │   │   └── metadata/
│   │   │       └── neighborhood-api.ts # [NEW] 50-node limited schema fetching
│   │   └── services/
│   │       └── sql-generator.ts # [UPDATED] Uses BigQuery Native Arrays for $expand
├── obq-hub/                     # THE UI GATEWAY (Next.js)
│   ├── src/
│   │   ├── app/
│   │   │   └── actions/         # Server Actions (Safe Passthrough)
│   │   │       └── metadataAction.ts
│   │   ├── components/
│   │   │   ├── Catalog/
│   │   │   └── VisualBuilder/   # [NEW] React Flow Components
│   │   │       ├── InteractiveErd.tsx 
│   │   │       ├── BqTableNode.tsx
│   │   │       └── QuerySummarySidebar.tsx
│   │   ├── lib/
│   │   │   ├── gateway-client.ts # Cookie-forwarding Fetch Wrapper
│   │   │   └── workers/
│   │   │       └── dagre-layout.worker.ts # [NEW] Web Worker for layout offloading
│   │   └── store/
│   │       └── useVisualQueryStore.ts # [NEW] Zustand Store (Visual vs Logical state)
├── common/                      # SHARED CONTRACTS
│   └── src/
│       └── types/
│           ├── elena-payload.ts 
│           ├── telemetry-events.ts # [NEW] Batched event payload schema
│           └── neighborhood-schema.ts # [NEW] Graph schema response
├── e2e/                         # DETERMINISTIC UI TESTING
│   └── visual-builder.spec.ts   # [NEW] Playwright tests mocking schema hashes & 403s
├── package.json                 # Monorepo Workspaces setup
└── docker-compose.yml
```

### Architectural Boundaries

**API Boundaries:**
- **Neighborhood API:** The `/v1/metadata/neighborhood` endpoint is strictly bound to the UI Server Actions. It imposes a hard 50-node limit and requires an active session. It is NOT part of the public OData standard.
- **Telemetry Boundary:** The `/v1/telemetry` endpoint is fire-and-forget (`navigator.sendBeacon`). It operates entirely outside the critical rendering path.

**Component Boundaries:**
- **Web Worker Boundary:** The `<InteractiveErd>` component communicates with `dagre-layout.worker.ts` exclusively via asynchronous message passing (`postMessage`), ensuring the React rendering thread is never blocked.
- **Error Boundary:** The `<InteractiveErd>` component is wrapped in a dedicated React Error Boundary which intercepts crashes, scrubs the Zustand state of PII, and ships the payload.

**Data Boundaries:**
- **Visual vs. Logical State:** The Zustand store strictly isolates `visual_nodes` (transient canvas state pruned by LRU) from `selected_paths` (the durable logical query serialized to the URL).

### Requirements to Structure Mapping

**Feature/Epic Mapping:**
- **Epic: Visual Query Builder Canvas**
  - Components: `obq-hub/src/components/VisualBuilder/`
  - Logic/State: `obq-hub/src/store/useVisualQueryStore.ts`
  - Performance: `obq-hub/src/lib/workers/dagre-layout.worker.ts`
  
- **Epic: Performance Guardrails**
  - Backend API: `obq-gateway/src/routes/v1/metadata/neighborhood-api.ts`
  - SQL Translation: `obq-gateway/src/services/sql-generator.ts` (Native Array Subqueries)

**Cross-Cutting Concerns:**
- **Observability:** `common/src/types/telemetry-events.ts` defines the contracts for `navigator.sendBeacon` payloads emitted from `obq-hub` and processed by `obq-gateway`.

### Integration Points

**Internal Communication:**
- **Canvas to Worker:** The React Flow component triggers layout recalculations by sending the raw topology to the Dagre Web Worker. The Worker replies with X/Y coordinates, triggering a single Zustand state update.

**Data Flow:**
1. **User Action:** User clicks a Table Node's "Expand" handle.
2. **State Update:** Zustand sets node to `loading` and pushes a lazy-fetch request.
3. **Gateway Call:** Next.js Server Action (`metadataAction.ts`) calls `/v1/metadata/neighborhood` (with a 5s AbortSignal timeout).
4. **Resolution:** Neighborhood API validates permissions and returns the hash-verified schema.
5. **Layout:** The new nodes are sent to the Web Worker for spatial positioning.
6. **Render:** Zustand receives coordinates and draws the expanded graph; telemetry event is flushed.

## Architecture Validation Results (Visual Query Builder Revision)

### Coherence Validation ✅

**Decision Compatibility:**
The integration of a computationally heavy client-side visualization tool (React Flow/Dagre) is heavily mitigated by the decision to offload layout calculations to a Web Worker. This ensures the Next.js `obq-hub` main thread remains fluid and compatible with standard React rendering lifecycles.

**Pattern Consistency:**
The "Safe Server Actions" error-handling pattern guarantees that the existing "Elena's Tips" interceptors in `obq-gateway` can successfully pass context up to the React Flow UI without triggering fatal React boundary exceptions.

**Structure Alignment:**
The split into `obq-hub` (Frontend), `obq-gateway` (Backend), and `common` (Shared Types) provides strict, physical boundaries that prevent accidental implementation bleed. Shared contracts for telemetry and errors are centrally located.

### Requirements Coverage Validation ✅

**Epic/Feature Coverage:**
The Visual Query Builder is fully supported. Complex graph states are managed, visual canvas rendering is offloaded, and cost metrics are accurately predicted via native BigQuery array translations on the backend.

**Functional Requirements Coverage:**
- The ability to navigate OData hierarchies visually is satisfied.
- The requirement to preserve UI state across IAM expirations is satisfied by Zustand URL serialization.
- The requirement to protect user data during crashes is met by the PII-scrubbing Error Boundary.

**Non-Functional Requirements Coverage:**
- **Performance:** Enforced via the 50-node Neighborhood API limit, 5-second `AbortSignal` timeouts, and Dagre Web Workers.
- **Accessibility:** Enforced via the strict `aria-hidden` canvas and the `aria-live` Query Summary Sidebar fallback.

### Implementation Readiness Validation ✅

**Decision Completeness:**
All critical implementation details, including network timeouts, React Flow testing approaches (data-testids), and layout offloading, are explicitly documented to guide AI agents.

**Structure Completeness:**
The project tree explicitly details the locations of the new `metadataAction.ts`, `dagre-layout.worker.ts`, and the `common` type definitions.

**Pattern Completeness:**
Naming conventions for React Flow custom nodes and Zustand stores are clearly defined. Telemetry communication patterns are established as non-blocking `navigator.sendBeacon` flows.

### Gap Analysis Results

- **Minor Gap (To be addressed in implementation):** The specific CSS Variable palette mapping for Dark Mode custom nodes needs to be formalized in `globals.css` during the UI styling phase. 

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**✅ Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION
**Confidence Level:** High

**Key Strengths:**
- **Thread Safety:** Web Worker offloading ensures complex data structures never freeze the UI.
- **Cost Protection:** Native BigQuery array subqueries prevent Cartesian explosions and inaccurate Dry-Run pricing.
- Universal Access: Strict screen-reader text fallback ensures the tool is highly accessible.

## Architectural Revision: Playwright CLI Migration (2026-05-22)

### Decision Priority Analysis

**Critical Decisions:**
- **Stateless Subprocess Launch Wrapper**: Spawning ephemeral `@playwright/cli` subprocesses over stdio instead of deploying active Model Context Protocol (MCP) servers or long-lived daemons. This prevents memory leaks and ensures process isolation.
- **Local Disk-Based accessibility Tree Snapshots**: Generating compact, flat YAML representation database structures of the browser's accessibility tree on disk. This limits the active reasoning payload size, reducing token consumption per E2E task by **80% to 95%**.
- **Decoupled Auth State Rehydration**: Serializing multi-tenant session assets (cookies, `localStorage`, `IndexedDB`) into local storage configuration files via `state-save` and rehydrating them instantly via `state-load`. This eliminates visual login steps, network overhead, and OAuth latency.

**Important Decisions:**
- **Coordinate-Free Interaction Targeting**: Selecting DOM nodes using stable index references (e.g. `e10`, `e24`) bound to aria accessibility markers rather than fragile pixel coordinates or dynamic CSS selectors.
- **Sequential Local Runs (`--workers=1`)**: Forcing sequential execution constraints for local agent E2E tasks to eliminate port contention with active Next.js Hot Module Replacement (HMR) compilation processes.
- **Diagnostics Screenshot Buffer Output**: Outputting lightweight diagnostic PNG screenshot buffers directly to disk on failure, providing a visual review layer without streaming continuous frame feeds.

### Data & State Architecture

**State Management & Storage Caching Flow:**
* **Authentication Cache**: Session states are written to isolated, ephemeral JSON configurations (`playwright/.auth/session.json`).
* **Snapshot Pipeline**: Asynchronous tree output generation:
  ```text
  Active Canvas Page ➔ aria-accessibility serializing ➔ Compact YAML tree ➔ Disk File
  ```
* **Coordinate-Free references**: Stable element references map to semantic role selectors.

### Security & Git Boundaries

* **Git Exclusion Rules**: Strict `.gitignore` configurations enforce the absolute exclusion of the `playwright/.auth/` workspace subdirectory. Storing cookies or bearer tokens on remote servers is strictly forbidden.
* **Master Session Protection**: Authentications are performed via backend endpoints utilizing secure environment variables.

### Integration & Monorepo Tooling Patterns

**Naming Patterns:**
* **Configuration File**: Root-level `.playwright/cli.config.json` containing default context launch parameters.
* **Wrapper Utilities**: Monorepo package scripts wrapped inside `package.json` mappings (e.g. `npm run test:agent`).

**Structure & Boundaries:**
* **Test Isolation**: Ephemeral agent browser test scripts are placed in `/e2e/agent/`, keeping them distinct from compiled CI regression tests in `/e2e/specs/`.
* **Private Network Path**: Local mocks run against Fastify directly rather than looping through the public gateway domain, preserving mock state integrity.

### Architecture Validation Results ✅

**Coherence Validation**: Decoupling the browser execution runtime from the AI's reasoning context through local disk files aligns perfectly with the stateless architecture of our Fastify gateway proxy.

**NFR & Cost Validation**: Cutting token footprint down by 80%+ directly supports developer tooling performance and controls operating margins.

---
