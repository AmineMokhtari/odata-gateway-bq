---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/planning-artifacts/research/market-office-bq-gateway-odata-research-2026-04-25.md
---

# odata-gateway-bq - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for odata-gateway-bq, decomposing the requirements from the PRD, UX Design Specification, and Architecture Document into implementable stories.

## Requirements Inventory

### Functional Requirements

- **FR1:** Users can access independent "OData Services" via project-specific URL segments.
- **FR2:** Users can automatically discover OData EDM metadata upon connection.
- **FR3:** Admins can trigger immediate schema re-discovery via a management endpoint.
- **FR4:** The System maintains a sharded, in-memory cache of OData schemas, isolated by tenant-URL.
- **FR5:** Users can view BigQuery datasets, tables, and views as OData EntitySets.
- **FR6:** The System can intercept OIDC Bearer tokens from incoming requests.
- **FR9:** Users maintain secure sessions without interactive login prompts.
- **FR11:** The System performs a BigQuery Dry Run for 100% of fetch requests.
- **FR12:** The System blocks execution if the Dry-Run estimate exceeds the scan budget.
- **FR13:** Users can view estimated cost and SQL via an "Explain" parameter.
- **FR14:** Admins can define scan budgets and rate limits per project-URL.
- **FR15:** Users can check current consumption via a usage endpoint.
- **FR16:** The System automatically cancels BigQuery Jobs on client disconnect.
- **FR17:** The System translates OData V4 filters/sorting/paging to BigQuery SQL.
- **FR18:** The System automatically casts RECORD/REPEATED types to JSON strings.
- **FR19:** The System streams results directly to minimize server buffering.
- **FR20:** The System injects Correlation IDs and user identities into BigQuery Job Labels.
- **FR21:** The System provides a standard health and version endpoint.
- **FR22:** The System adapts to client-specific personas (Excel/Power BI) for protocol compatibility.
- **FR24:** The System implements a Trusted Subsystem mode workflow (Verify -> App Rules -> Fetch).
- **FR26:** The System provides deterministic OData error codes (BudgetExceeded, Unauthorized).

### NonFunctional Requirements

- **NFR-P1:** OData $metadata responses < 2s for 95% of requests.
- **NFR-P2:** Internal access rule checks must complete in < 200ms.
- **NFR-P3:** Memory footprint must remain < 256MB via 100% streaming.
- **NFR-S1:** 100% of queries decorated with native Job Labels (user identity + correlation ID).
- **NFR-S2:** Mandatory enforcement of TLS 1.3.
- **NFR-R1:** 99.9% uptime during business hours; MTTR < 15 minutes.
- **NFR-SC1:** Support for 100+ concurrent tenant-URLs.

### Additional Requirements

- **Starter Foundation:** Fastify with TypeScript 5.x initialized via `fastify-cli`.
- **Infrastructure:** Target deployment on Google Cloud Run (Fully managed, serverless).
- **Security Pattern:** Trusted Subsystem (exclusive model) using OIDC identity verification.
- **Process Pattern:** "Audit-Execute" Request Pipeline (Authenticate -> Audit -> Execute -> Stream).
- **Dependencies:** `odata-v4-sql` for core OData translation; `lru-cache` for schema storage.
- **Logging:** Mandatory use of `pino` with `correlation_id` injection.

### UX Design Requirements

- **UX-DR1:** Implement **OData URL Builder** (Dropdown selection for Project/Dataset + One-click Copy).
- **UX-DR2:** Implement **Live Dry-Run Circuit Breaker** visualizer with three states: Safety-Green, Caution-Amber, and Blocked-Red.
- **UX-DR3:** Implement **Success Pulse Badge** connection health indicator (Listening/Verifying/Connected states).
- **UX-DR4:** Apply **Visual Design Foundation**: Indigo-700 (Primary), Emerald (Success), Amber (Warning), and Geist Mono for code snippets.
- **UX-DR5:** Create **Story-Driven Hero Section** featuring the "Elena" (Stranded Analyst) narrative.
- **UX-DR6:** Implement **Mobile-First Responsive Layout** with focused Bottom-Action Bar for CTA.
- **UX-DR7:** Implement **Governance Signaling Patterns**: Budget badges and OIDC session pulses.
- **UX-DR8:** Target **WCAG Level AA Accessibility**: Contrast ratios, aria-labels, and keyboard navigation support.
- **UX-DR9:** Use **Shadcn/UI + Radix UI** primitives for high-trust component implementation.

### FR Coverage Map

- **FR1-FR5**: Epic 2 - Automated Data Marketplace
- **FR6, FR9, FR20, FR24**: Epic 1 - Identity & Trusted Access
- **FR11, FR12, FR16-FR19, FR26**: Epic 3 - Governed Data Streaming
- **FR13-FR15, FR21, FR22**: Epic 4 - Data Marketplace Web Portal
- **FR13-FR15 (Advanced/Guided)**: Epic 6 - Self-Service Governance

## Epic List

### Epic 1: Identity & Trusted Access
Users can securely authenticate via OIDC and be authorized against internal application rules to access BigQuery via a master account.
**FRs covered:** FR6, FR9, FR20, FR24

### Epic 2: Automated Data Marketplace
Users can automatically discover authorized BigQuery datasets as standard OData EntitySets with sub-2s latency.
**FRs covered:** FR1, FR2, FR3, FR4, FR5

### Epic 3: Governed Data Streaming
The system translates OData queries to SQL, enforces proactive scan budgets, and streams results directly to the user.
**FRs covered:** FR11, FR12, FR16, FR17, FR18, FR19, FR26

### Epic 4: Data Marketplace Web Portal
A modern, story-driven web interface that provides analysts with the tools and confidence to connect their favorite BI tools.
**FRs covered:** FR13, FR14, FR15, FR21, FR22

### Epic 5: Trusted Subsystem Refactor
Architectural transition to an exclusive Trusted Subsystem model to eliminate IAM management overhead and improve latency.
**FRs covered:** FR6, FR9, FR24 (Refined)

### Epic 6: Self-Service Governance & Guided Queries
Empower 'Zero Knowledge' users by transforming technical scan errors into actionable business advice and providing UI-driven access to advanced OData protocol features.
**FRs covered:** FR13, FR14, FR15 (Self-Service variants)

---

## Epic 1: Identity & Trusted Access

Establish the secure foundation. Users can authenticate via OIDC and be authorized against internal rules to access BigQuery via a master account.

### Story 1.1: Bootstrap Foundation from Fastify Starter
As a Developer, I want to initialize the project using the Fastify CLI and TypeScript 5.x, so that I have a high-performance, standardized backend foundation.
**Acceptance Criteria:**
**Given** the project requirements.
**When** I run `npx fastify-cli generate . --lang=ts`.
**Then** the project structure includes `plugins/`, `routes/`, and `services/`.
**And** `package.json` includes TypeScript 5.x and `fastify`.

### Story 1.2: OIDC Token Interception & Validation
As a Security Admin, I want the system to intercept and verify OIDC Bearer tokens from incoming requests, so that only authenticated users can access the gateway.
**Acceptance Criteria:**
**Given** an incoming request to the OData API.
**When** a valid OIDC token is present in the Authorization header.
**Then** the request is allowed to proceed to the authorization layer.
**And** invalid or missing tokens return a 401 Unauthorized OData error.

### Story 1.3: Identity Extraction & Correlation ID Generation
As a Developer, I want to extract the user's identity from the token and generate a unique Correlation ID, so that every request is traceable.
**Acceptance Criteria:**
**Given** a verified OIDC token.
**When** the request enters the pipeline.
**Then** the system extracts the `email` or `sub` claim.
**And** it generates a unique UUID `correlation_id` for the request lifecycle.

### Story 1.4: Internal Rule-Based Authorization (Trusted Subsystem)
As a Security Architect, I want the system to check extracted identities against internal rule-based authorization (e.g., `tenants.yaml`), so that I can control data access without GCP IAM sprawl.
**Acceptance Criteria:**
**Given** a verified identity and a target project/dataset.
**When** checked against internal rules.
**Then** the system returns 'Allow' or 'Deny' based on the mapping.

---

## Epic 2: Automated Data Marketplace

Enable frictionless discovery. Users can automatically discover authorized BigQuery datasets as standard OData EntitySets.

### Story 2.1: Multi-tenant URL Routing
As a Business User, I want to access my data via a project-specific URL segment, so that my environment is isolated from other tenants.
**Acceptance Criteria:**
**Given** a request to `/v1/:projectId/:datasetId`.
**When** the URL is parsed.
**Then** the system uses these segments as keys for metadata and data lookups.
**And** it prevents cross-tenant access if the user is not authorized for that segment.

### Story 2.2: BigQuery Metadata Introspection
As the System, I want to introspect the BigQuery schema for a specific dataset, so that I can map tables and views to OData EntitySets.
**Acceptance Criteria:**
**Given** a valid GCP project and dataset.
**When** a metadata refresh is triggered.
**Then** the system fetches table names, columns, and data types from the BigQuery API.

### Story 2.3: Sharded In-Memory Metadata Cache
As the System, I want to store introspected metadata in a sharded in-memory LRU cache, so that metadata requests meet the < 2s performance target.
**Acceptance Criteria:**
**Given** a successful metadata introspection.
**When** the result is cached.
**Then** it is keyed by the tenant-URL segment.
**And** future requests for the same segment return the cached result instantly.

### Story 2.4: OData EDM Generation ($metadata)
As a Data Analyst, I want the system to generate a valid OData V4 $metadata (EDM) document, so that my BI tool can automatically understand the data schema.
**Acceptance Criteria:**
**Given** cached metadata.
**When** a request to `/$metadata` is received.
**Then** the system returns a valid XML EDM document mapping BigQuery types to Edm types.

---

## Epic 3: Governed Data Streaming

The 'Engine' phase. The system translates OData to SQL, enforces proactive scan budgets, and streams results directly.

### Story 3.1: OData-to-SQL Translation Engine
As a User, I want my OData query parameters ($filter, $select, $orderby) translated to BigQuery SQL, so that I can query data using standard OData syntax.
**Acceptance Criteria:**
**Given** an OData query.
**When** it is processed by the translation engine.
**Then** it produces a valid BigQuery standard SQL string.

---

## Epic 4: Data Marketplace Web Portal

Empower the Analyst. A story-driven web interface that allows users like 'Elena' to discover datasets and generate connection URLs.

### Story 4.2: OData URL Builder
As an Analyst, I want to generate a connection URL by selecting my project and dataset from a dropdown, so that I don't have to construct URLs manually.
**Acceptance Criteria:**
**Given** I am on the Portal.
**When** I select a project and dataset.
**Then** the Portal displays a complete OData URL ready for copying.
**And** it includes the 'Explain' parameter for easy testing.

---

## Epic 5: Trusted Subsystem Refactor

Architecture stabilization. Moving to an exclusive Trusted Subsystem model to eliminate IAM management overhead.

### Story 5.1: Trusted Subsystem Identity Verification
As a Security Architect, I want the gateway to use a single master service account for BigQuery execution while verifying end-user identities at the app level, so that I don't have to manage 1,000+ individual GCP IAM permissions.
**Acceptance Criteria:**
**Given** an authenticated user.
**When** a query is executed.
**Then** the system uses the 'Trusted Subsystem' master key for the BigQuery API call.
**And** it attaches the user's verified identity as a job label.

---

## Epic 6: Self-Service Governance & Guided Queries

Empower 'Zero Knowledge' users by transforming technical scan errors into actionable business advice.

### Story 6.1: Actionable Error Layer (The 'Elena' Tips)
As an Analyst, I want to see a business-friendly explanation and 'next step' tip when my query fails (e.g., BudgetExceeded), so that I can fix the issue myself without technical help.
**Acceptance Criteria:**
**Given** an OData request returns a `403 BudgetExceeded` error.
**When** the Web Portal receives this error.
**Then** it displays: 'Query too large for current budget.'
**And** it provides a 'Next Step' tip: 'Try selecting fewer columns or adding a Date filter to reduce scan size.'

### Story 6.2: Visual Join Builder ($expand)
As an Analyst, I want to select related tables via a UI toggle in the URL Builder, so that I can fetch linked data without writing OData `$expand` syntax.
**Acceptance Criteria:**
**Given** a selected EntitySet has known relationships.
**When** I use the URL Builder.
**Then** I see a 'Related Data' section with checkboxes for available joins.
**And** selecting a join automatically appends the correct `$expand` parameter to the URL.

### Story 6.3: Visual Aggregation Builder ($apply)
As an Analyst, I want to apply sums and averages via the UI, so that I can generate summary data without manual OData calculations.
**Acceptance Criteria:**
**Given** a numerical column is selected.
**When** I enable the 'Summarize' toggle.
**Then** I can select an aggregation function (Sum, Avg, Count).
**And** the URL Builder generates the complex `$apply=aggregate(...)` syntax.

### Story 6.4: Self-Service Usage Dashboard
As a Business User, I want to see my current scan usage vs. budget in a visual chart, so that I can manage my data consumption proactively.
**Acceptance Criteria:**
**Given** I am on the Portal.
**When** I view the 'Usage' tab.
**Then** I see a progress bar showing 'Used GB' vs. 'Monthly Budget'.

---

## Epic 8: Advanced Performance & Scalability

Optimize the engine for enterprise-scale workloads and complex BI tool interactions.

### Story 8.1: Smart Paging (Query Cursors)
As an Analyst (Elena), I want the system to efficiently handle multi-page datasets, so that I can scroll through thousands of rows in Excel without paying for full BigQuery re-scans on every page.
**Acceptance Criteria:**
- **Given** a query results in multiple pages.
- **When** the first response is returned.
- **Then** it includes an `@odata.nextLink` containing a `$skiptoken` with the BigQuery `jobId`.
- **And** subsequent requests with the `$skiptoken` fetch results from the same Job without re-scanning.

### Story 8.2: Nested Column Selection ($select inside $expand)
As an Analyst (Elena), I want to select specific columns for related tables, so that I can minimize data transfer and reduce BigQuery scan costs for complex joins.
**Acceptance Criteria:**
- **Given** a query with `$expand=Table($select=Col1,Col2)`.
- **When** the SQL is generated.
- **Then** the system produces a BigQuery subquery with a restricted SELECT list instead of `SELECT *`.

### Story 8.3: OData $count Backend Support
As a BI User (Elena), I want to see the total number of records in my dataset, so that my BI tools (Excel/Power BI) can accurately display paging progress and total volume.
**Acceptance Criteria:**
- **Given** an OData request with `$count=true`.
- **When** the query is executed.
- **Then** the response includes the `@odata.count` property containing the total number of rows matching the filters.
- **And** the count is retrieved efficiently from BigQuery Job metadata to minimize additional scans.

### Story 8.4: OData $apply Backend Support (Analytics Push-down)
As an Analyst (Elena), I want to perform sums, averages, and groupings at the source, so that I can work with summary data without downloading millions of raw records.
**Acceptance Criteria:**
- **Given** an OData request with `$apply=groupby((Region),aggregate(Amount with sum as Total))`.
- **When** the SQL is generated.
- **Then** the system produces a BigQuery `GROUP BY Region` query with `SUM(Amount) AS Total`.
- **And** the system supports multiple aggregations and grouping columns.

