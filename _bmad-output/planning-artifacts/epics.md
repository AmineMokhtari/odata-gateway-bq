---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# odata-gateway-bq - Epic Breakdown (Hybrid BFF)

## Overview

This document provides the complete epic and story breakdown for odata-gateway-bq, decomposing the requirements from the PRD, UX Design Specification, and the revised Architecture Document into implementable stories.

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

### Architectural Requirements (Hybrid Model)

- **AR1:** Fastify-Centric Auth: Centralized OIDC and session management in the backend.
- **AR2:** Gateway Client: A unified `lib/gateway-client.ts` in Next.js for cookie-aware backend communication.
- **AR3:** Hybrid Pathing: Metadata and discovery route through Server Actions; large results stream Directly from Fastify.
- **AR4:** Transparent Cookie Proxy: Next.js forwards browser cookies to Fastify and propagates Set-Cookie updates back.
- **AR5:** Advice Passthrough: "Elena Tips" are carried through the ActionResult union from Fastify to the UI.
- **AR6:** Resilient Stream Protocol: Keep-alive heartbeats and zombie job reaper for Excel stability.

### UX Design Requirements

- **UX-DR1:** Implement OData URL Builder (Dropdown selection + One-click Copy).
- **UX-DR2:** Implement Live Dry-Run Circuit Breaker visualizer (Green/Amber/Red).
- **UX-DR3:** Implement Success Pulse Badge connection health indicator.

---

### FR Coverage Map

- **FR1-FR5**: Epic 2 - Intelligent Data Catalog
- **FR6, FR9, FR24, AR1, AR2, AR4**: Epic 1 - Secure Hybrid Bridge
- **FR11, FR12, FR16-FR19, FR26, AR3, AR5, AR6**: Epic 3 - Governed Data Streaming
- **FR13-FR15, FR21, FR22, UX-DR1-DR3**: Epic 4 - Visual Connection Builder

## Epic List

### Epic 1: Secure Hybrid Bridge
Establish the secure communication "spine." Fastify handles OIDC and session state, while Next.js implements the Transparent Cookie Proxy and Gateway Client to enable authenticated passthrough.
**FRs covered:** FR6, FR9, FR24, AR1, AR2, AR4

### Epic 2: Intelligent Data Catalog
Implement the discovery layer. This epic migrates dataset and table discovery to Next.js Server Actions, utilizing the Gateway Client to fetch metadata from Fastify's sharded cache.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, AR3

### Epic 3: Governed Data Streaming
The "Heavy Lifting" engine. Fastify performs the BigQuery Dry Run and streams large OData results directly to the user. It also implements the Elena Advice Layer to decorate streaming errors with business logic.
**FRs covered:** FR11, FR12, FR16, FR17, FR18, FR19, FR26, AR3, AR5, AR6

### Epic 4: Visual Connection Builder
Finalize the high-trust UI. This epic brings the URL Builder, Pulse Badge, and Circuit Breaker to life, integrating them with the streaming engine's cost signals.
**FRs covered:** FR13, FR14, FR15, FR21, FR22, UX-DR1, UX-DR2, UX-DR3

---

## Epic 1: Secure Hybrid Bridge

Establish the secure communication "spine." Fastify handles OIDC and session state, while Next.js implements the Transparent Cookie Proxy and Gateway Client to enable authenticated passthrough.

### Story 1.1: Fastify OIDC & Session Setup
As a Developer,  
I want Fastify to handle the OIDC login flow and issue an HttpOnly session cookie,  
So that identity is centrally managed in the backend.

**Acceptance Criteria:**
**Given** an unauthenticated request to the OData Gateway.
**When** the user initiates login.
**Then** Fastify performs the OIDC redirect/callback flow.
**And** issues a secure, `HttpOnly`, `SameSite: Lax` session cookie.

### Story 1.2: Next.js Gateway Client (`lib/gateway-client.ts`)
As a Developer,  
I want a unified `gatewayClient` in Next.js that wraps the native `fetch` API,  
So that all backend communication is consistent and cookie-aware.

**Acceptance Criteria:**
**Given** a Next.js Server Component or Action.
**When** calling `gatewayClient.fetch()`.
**Then** the client automatically pulls cookies from `next/headers` and injects them into the outgoing request to Fastify.
**And** it handles base URL and timeout configurations.

### Story 1.3: Transparent Cookie Proxy Implementation
As a Developer,  
I want Next.js Server Actions to propagate `Set-Cookie` headers from Fastify back to the browser,  
So that the user's session remains synchronized without manual client-side intervention.

**Acceptance Criteria:**
**Given** a Server Action calling Fastify via the `gatewayClient`.
**When** Fastify returns a `Set-Cookie` header (e.g., on token refresh).
**Then** the `gatewayClient` extracts the header.
**And** the Server Action uses the `cookies().set()` API to update the browser's cookie jar.

### Story 1.4: Correlation ID & Traceability
As a Developer,  
I want every request in the hybrid pipeline to share a unique Correlation ID,  
So that I can trace a single user interaction across the Next.js and Fastify logs.

**Acceptance Criteria:**
**Given** a request entering a Next.js Server Action.
**When** calling the Fastify backend.
**Then** the system injects an `x-correlation-id` header.
**And** Fastify uses this ID for all downstream BigQuery Job Labels.

---

## Epic 2: Intelligent Data Catalog

Implement the discovery layer. This epic migrates dataset and table discovery to Next.js Server Actions, utilizing the Gateway Client to fetch metadata from Fastify's sharded cache.

### Story 2.1: Tenant & Project Discovery Action
As a User,  
I want to fetch my authorized BigQuery projects via a Next.js Server Action,  
So that I can see the list of data landscapes I am allowed to access.

**Acceptance Criteria:**
**Given** an authenticated user session.
**When** the Catalog page loads.
**Then** a Server Action calls Fastify's discovery endpoint via the `gatewayClient`.
**And** returns a list of authorized projects to the UI.

### Story 2.2: BigQuery Dataset Introspection Action
As a User,  
I want to fetch dataset metadata (tables/views) via a Next.js Server Action,  
So that I can see them represented as OData EntitySets in the portal.

**Acceptance Criteria:**
**Given** a selected project.
**When** I browse for datasets.
**Then** a Server Action fetches the mapped EntitySets from Fastify.
**And** displays them with their descriptions and schema types.

### Story 2.3: Sharded Metadata Cache Lookup
As a Developer,  
I want the discovery actions to prioritize Fastify's sharded in-memory LRU cache,  
So that metadata discovery responses consistently meet the sub-2s target.

**Acceptance Criteria:**
**Given** a request for project/dataset metadata.
**When** Fastify processes the request.
**Then** it checks the tenant-sharded LRU cache before hitting the BigQuery API.
**And** returns the cached EDM model if available.

### Story 2.4: OData EDM ($metadata) Generation (Direct Path)
As a Data Analyst,  
I want the system to serve a valid OData V4 XML EDM ($metadata) document via a direct Fastify route,  
So that external tools like Excel can automatically understand the schema.

**Acceptance Criteria:**
**Given** a tool like Excel connecting to the Direct Data URL.
**When** it requests `/$metadata`.
**Then** Fastify returns a valid XML document mapping BigQuery types to Edm types.
**And** verifies the user session cookie before serving.
---

## Epic 3: Governed Data Streaming

The "Heavy Lifting" engine. Fastify performs the BigQuery Dry Run and streams large OData results directly to the user. It also implements the Elena Advice Layer to decorate streaming errors with business logic.

### Story 3.1: BigQuery Dry-Run Audit Action
As an Analyst,  
I want to see the estimated cost and safety status of my query before execution,  
So that I can stay within my project's scan budget.

**Acceptance Criteria:**
**Given** a set of OData query parameters in the UI.
**When** the UI triggers a "Dry Run" via a Server Action.
**Then** Fastify performs a BigQuery `dryRun` and returns the byte count and safety signal (Safe/Caution/Blocked).
**And** the UI updates the Circuit Breaker visualizer.

### Story 3.2: Elena Advice Decorator (Fastify Plugin)
As a Developer,  
I want Fastify to intercept BigQuery errors and decorate them with an `elena_tip` object,  
So that technical failures are transformed into actionable business advice.

**Acceptance Criteria:**
**Given** a BigQuery error (e.g., `403 Access Denied` or `Quota Exceeded`).
**When** Fastify processes the response.
**Then** it attaches a business-friendly `advice` string and a `quick_fix` suggestion.
**And** returns this via the `ActionResult` union to the Next.js Action.

### Story 3.3: Direct Streaming Data Route
As a User,  
I want to stream large result sets directly from Fastify to my BI tool,  
So that I get maximum performance without overloading the Next.js memory footprint.

**Acceptance Criteria:**
**Given** a valid OData query URL.
**When** accessed directly via the Fastify "Data" endpoint.
**Then** Fastify streams rows individually as they are received from BigQuery.
**And** performs on-the-fly type casting (e.g., JSON strings for REPEATED types).

### Story 3.4: Resilient Stream (Keep-Alive & Job Reaper)
As an Excel User,  
I want my data connection to be stable during long downloads and my backend jobs to be cleaned up if I disconnect,  
So that I don't waste project budget on "zombie" queries.

**Acceptance Criteria:**
**Given** an active data stream.
**When** BigQuery is processing a complex query.
**Then** Fastify sends "Keep-Alive" heartbeats (whitespaces) to keep the Excel connection open.
**And** if the client disconnects, Fastify immediately calls `job.cancel()` in BigQuery.

---

## Epic 4: Visual Connection Builder

Finalize the high-trust UI. This epic brings the URL Builder, Pulse Badge, and Circuit Breaker to life, integrating them with the streaming engine's cost signals and "Elena" advice.

### Story 4.1: Reactive URL Builder Component
As an Analyst,  
I want to select my project and dataset from a dropdown and see the OData URL update reactively,  
So that I can build valid connection strings without manual editing.

**Acceptance Criteria:**
**Given** authorized projects and datasets fetched via Server Actions.
**When** I select a combination in the UI.
**Then** the component displays a pre-formatted OData URL.
**And** includes a "Copy to Clipboard" action.

### Story 4.2: Circuit Breaker & Safety Status UI
As an Analyst,  
I want a visual status badge that reflects the "Dry Run" results (Safe/Caution/Blocked),  
So that I know if my query will succeed before I copy it to my BI tool.

**Acceptance Criteria:**
**Given** a Dry Run result from the Server Action.
**When** the safety status is returned.
**Then** the UI displays a colored badge: **Green** (Safe), **Amber** (Caution), or **Red** (Blocked).
**And** shows the estimated bytes/cost in a tooltip.

### Story 4.3: Elena Advice Drawer (Reactive UI)
As an Analyst,  
I want an "Elena Advice" drawer to open automatically when a query is blocked or fails,  
So that I can see the business-friendly remediation steps without hunting for logs.

**Acceptance Criteria:**
**Given** an `ActionResult` with an `elena_tip` metadata object.
**When** a Server Action returns an error or warning.
**Then** the UI reactively opens the Elena Drawer.
**And** displays the advice prose and "Quick Fix" buttons.

### Story 4.4: Success Pulse & Health Signal
As an Analyst,  
I want to see a "Connection Pulse" that shows my session is verified and the backend is ready,  
So that I have confidence that the gateway is operational before I start work.

**Acceptance Criteria:**
**Given** a successful health check and session verification.
**When** I am on the dashboard.
**Then** the UI displays a pulsing "Verified" status.
**And** indicates the current tenant context.

