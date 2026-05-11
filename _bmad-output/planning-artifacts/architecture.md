---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 4, 5, 6, 7, 8]
inputDocuments: ['_bmad-output/planning-artifacts/prd.md', '_bmad-output/brainstorming/brainstorming-session-2026-04-23-16-30.md']
workflowType: 'architecture'
project_name: 'odata-gateway-bq'
user_name: 'Amine_mokhtari'
date: '2026-04-24'
lastStep: 8
status: 'complete'
completedAt: '2026-05-09'
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

### Integration Points

**Data Flow:**
1. **User Action**: Change an OData parameter in the UI.
2. **Audit (Frontend)**: Hook calls `/dry-run` endpoint.
3. **Audit (Backend)**: BQ Dry-Run executed via `bq-executor.ts`.
4. **Signal (Frontend)**: Pulse Badge updates color based on safety status.
5. **Advice (Backend)**: If audit fails, Elena plugin decorates the error.
6. **Guidance (Frontend)**: Elena Drawer opens to show actionable fixes.

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

