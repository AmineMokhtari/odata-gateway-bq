---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments: ['_bmad-output/planning-artifacts/prd.md', '_bmad-output/brainstorming/brainstorming-session-2026-04-23-16-30.md']
workflowType: 'architecture'
project_name: 'odata-gateway-bq'
user_name: 'Amine_mokhtari'
date: '2026-04-24'
lastStep: 8
status: 'complete'
completedAt: '2026-04-24'
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

**Important Decisions (Shape Architecture):**
- **Metadata Management:** Sharded in-memory LRU cache isolated by tenant-URL.
- **Hosting Strategy:** Google Cloud Run (Fully managed, serverless).
- **Core Translation:** `odata-v4-sql` for SQL generation.

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

### Authentication & Security

**Security Guardrails:**
- **Decision:** Dry-Run Interceptor.
- **Rationale:** Mandatory pre-flight query to enforce enterprise scan budgets before BigQuery execution.
- **Affects:** SQL Generation, Execution Pipeline.

### Infrastructure & Deployment

**Hosting Platform:**
- **Decision:** Google Cloud Run.
- **Rationale:** Provides the best balance of cost (scale-to-zero) and performance for a stateless proxy. Native integration with GCP IAM and application default credentials.
- **Affects:** CI/CD Pipeline, Deployment Strategy.

### Decision Impact Analysis

**Implementation Sequence:**
1. **Bootstrap Foundation:** Initialize Fastify with TypeScript.
2. **Auth verification:** Implement OIDC verification plugin.
3. **Metadata Service:** Implement sharded schema caching and discovery.
4. **Data Pipeline:** Implement streaming SQL execution with Dry-Run gating.

**Cross-Component Dependencies:**
The **Cost Auditor** depends on the **SQL Generator's** output. The **Data Fetcher** depends on the **Auth plugin** providing a verified user identity. The **Metadata Service** must be tenant-aware to support the **URL Routing** segment.

## Implementation Patterns & Consistency Rules

### Naming Patterns

**API & OData Naming:**
- **URL Parameters:** `:projectId`, `:datasetId` (camelCase).
- **OData Entities:** PascalCase (mapped 1:1 from BigQuery tables where possible).
- **Query Parameters:** standard OData (`$filter`, `$top`, etc.).

**Code Naming Conventions:**
- **Variables & Functions:** `camelCase` (e.g., `generateSql`).
- **Classes & Types:** `PascalCase` (e.g., `MetadataCache`).
- **Files:** `kebab-case.ts` (e.g., `auth-plugin.ts`).
- **BigQuery Labels:** `snake_case` (e.g., `correlation_id`).

### Structure Patterns

**Project Organization:**
- **`src/plugins/`:** Sharded metadata cache, BigQuery client factory.
- **`src/routes/`:** OData V1 data and admin endpoints.
- **`src/middleware/`:** Dry-Run enforcer.
- **`src/lib/`:** OData-to-SQL translation wrappers, type-casting utilities.
- **`tests/`:** Mirror the `src/` structure for unit and integration tests.

### Format Patterns

**API Response Formats:**
- **Success:** Direct OData JSON stream (`odata.metadata=minimal`).
- **Error:** Strict OData V4 Error Envelope: `{ "error": { "code": string, "message": string } }`.
- **Dates:** 100% ISO 8601 strings in JSON.

**Data Exchange Formats:**
- **Internal Config:** YAML for project-URL metadata and rule mapping.
- **Relationships:** JSON for the explicit `relationships.json` manifest.

### Process Patterns

**The "Audit-Execute" Pipeline:**
All data requests must follow this exact sequential pattern:
1. `Authenticate`: Verify OIDC token identity.
2. `Audit`: Execute BigQuery Dry-Run and validate against budget.
3. `Execute`: Create BQ query stream using master service account.
4. `Stream`: Pipe results through OData envelope transformer to response.

**Error Recovery:**
- Transient GCP/OIDC errors must trigger a max of 3 retries with exponential backoff before returning a `503` or `429`.

### Enforcement Guidelines

**All AI Agents MUST:**
- Use `pino` for all logging, including the `correlation_id` in every log line.
- Ensure 100% test coverage for the `odata-v4-sql` translation edge cases.
- Never buffer result sets in memory; use `stream.Pipeline` or `finished(stream)`.

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
odata-gateway-bq/
├── .github/workflows/
│   └── deploy-cloud-run.yml
├── config/
│   ├── tenants.yaml             # Multi-tenant routing & access rule config
│   └── relationships.json       # Explicit OData navigation property map
├── src/
│   ├── app.ts                   # Fastify entry point
│   ├── plugins/
│   │   ├── bq-client.ts         # BQ client factory (using master account)
│   │   ├── auth.ts              # OIDC verification plugin
│   │   └── metadata-cache.ts    # Isolated LRU cache sharded by tenant-URL
│   ├── middleware/
│   │   └── audit/
│   │       └── dry-run-gate.ts     # Mandatory pre-flight cost enforcer
│   ├── routes/
│   │   ├── v1/
│   │   │   ├── data.ts          # Main OData EntitySet endpoints
│   │   │   └── admin.ts         # /refresh and /usage endpoints
│   │   └── health.ts            # /health check
│   ├── services/
│   │   ├── bq-executor.ts       # Streaming BigQuery job management
│   │   └── odata-metadata.ts    # EDM generation and bootstrapping
│   ├── lib/
│   │   ├── transformers/
│   │   │   ├── json-caster.ts   # TO_JSON_STRING for nested types
│   │   │   └── odata-envelope.ts # Streaming JSON object wrapper
│   │   └── sql-generator.ts     # odata-v4-sql integration
│   └── types/
│       └── odata.d.ts           # Shared OData schema types
├── tests/
│   ├── unit/
│   ├── integration/             # Mapped to User Journeys
│   └── mocks/                   # GCP & OIDC Provider mocks
├── package.json
├── tsconfig.json
└── docker-compose.yml           # For local dev simulation
```

### Architectural Boundaries

**API Boundaries:**
The primary boundary is the **URL-Based Tenant Segment** (`/v1/:projectId`). All internal service lookups (Auth, Metadata, BQ Client) use this segment as their isolation key.

**Component Boundaries:**
- **Middleware Boundary:** All identity and cost validation happens *before* any SQL is generated.
- **Service Boundary:** The `bq-executor` never sees the OData query; it only receives the translated SQL and user identity for logging.
- **Transformation Boundary:** Data is never held in memory; transformation happens strictly in the Node.js `stream.Pipeline`.

### Requirements to Structure Mapping

**Cross-Cutting Concerns Mapping:**
- **Identity Verification:** `src/plugins/auth.ts`
- **Cost Circuit Breaker:** `src/middleware/audit/dry-run-gate.ts`
- **Tenant Isolation:** `src/plugins/metadata-cache.ts` (Sharding logic)
- **Lossless Fidelity:** `src/lib/transformers/json-caster.ts`

### Integration Points

**External Integrations:**
- **OIDC Provider:** Discovered via `.well-known/openid-configuration`.
- **BigQuery API:** Used for `dryRun: true` and `createQueryStream` via master service account.

**Data Flow:**
1. Incoming OData Request → 
2. **Auth Plugin** (Identity verification) → 
3. **SQL Generator** (odata-v4-sql) → 
4. **Audit Middleware** (Dry-Run Check) → 
5. **BQ Executor** (Job creation) → 
6. **Transformer Pipeline** (Stream transformation) → 
7. HTTPS Response Stream.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
Technology choices (Fastify, TypeScript, Cloud Run) are highly compatible. The sharded plugin architecture natively supports multi-tenant isolation.

**Pattern Consistency:**
Implementation patterns (naming, structure, formats) directly support the architectural decisions for a stateless, high-performance proxy.

**Structure Alignment:**
The project tree mirrors the Fastify CLI structure while providing dedicated locations for the unique "Dry-Run" and "Auth" components.

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**
All remaining functional requirements (FR1-FR6, FR9-FR22, FR24, FR26) are architecturally supported. The "Audit-Execute" process pattern ensures FR11-FR16 are strictly followed.

**Non-Functional Requirements Coverage:**
Performance targets (< 2s discovery) are addressed through LRU caching. The < 256MB footprint is guaranteed by the Transform Stream pipeline.

### Implementation Readiness Validation ✅

**Decision Completeness:**
All critical decisions (Caching, Streaming, Deployment) are documented with rationales and version targets.

**Structure Completeness:**
The project directory structure is complete and specific, mapping requirements to individual files and middleware.

**Pattern Completeness:**
Naming, structure, and format patterns address all potential AI agent conflict points.

### Gap Analysis Results

**Important Gaps:**
- **Retry Jitter:** Specify the exact jitter algorithm for the exponential backoff in OIDC retries.
- **Circuit Breaker Thresholds:** Define the "Panic" threshold where the gateway temporarily halts all BQ jobs if scan budgets are exceeded globally.

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
- Stateless, scalable design perfectly suited for Cloud Run.
- Simplified security model reduces cross-cloud handshake latency.
- Cost-aware pipeline prevents accidental GCP spend.

**Areas for Future Enhancement:**
- Transition to Redis for distributed metadata caching if scaling beyond 100+ tenants.
- Implementation of a web-based "Marketplace Portal."

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented.
- Use the **"Audit-Execute" Pipeline** pattern for every data request.
- Ensure 100% result streaming; never buffer data in the Node.js layer.

**First Implementation Priority:**
```bash
npx fastify-cli generate . --lang=ts
npm install
```
