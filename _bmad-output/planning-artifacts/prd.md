---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-e-01-discovery', 'step-e-02-review', 'step-e-03-edit']
inputDocuments: ['_bmad-output/brainstorming/brainstorming-session-2026-04-23-16-30.md']
documentCounts:
  briefCount: 0
  researchCount: 0
  brainstormingCount: 1
  projectDocsCount: 0
classification:
  projectType: 'API Backend / Data Gateway'
  domain: 'Data Infrastructure / Enterprise Analytics'
  complexity: 'High'
  projectContext: 'greenfield'
workflowType: 'prd'
lastEdited: '2026-04-24'
editHistory:
  - date: '2026-04-23'
    changes: 'Implemented Hybrid Security Model: added Impersonation Mode (IAM-delegated) and Trusted Subsystem (App-governed) workflows.'
  - date: '2026-04-23'
    changes: 'Applied Top 3 validation improvements: implemented technology-agnostic phrasing in NFRs, added deterministic OData error codes, and specified metadata cache isolation logic.'
  - date: '2026-04-24'
    changes: 'Simplified architecture by removing Impersonation Mode. Transitioned to exclusive Trusted Subsystem model.'
  - date: '2026-05-16'
    changes: 'Architectural Hardening: Migrated all UI metadata to Server Actions (Server-to-Server). Implemented 1:N relationship discovery and Identity-Job security binding.'
  - date: '2026-05-19'
    changes: 'Added interactive ERD visualization for dataset exploration to Vision, User Journeys, and Functional Requirements.'
---

# Product Requirements Document - odata-gateway-bq

**Author:** Amine_mokhtari
**Date:** 2026-04-24

## Executive Summary

The **odata-gateway-bq** is a production-grade, zero-trust data gateway designed to transform the enterprise lakehouse into a governed **Data Catalog**. It eliminates the "SQL Tax" by providing business users in Excel, Power BI, and Microsoft Copilot with read-only, protocol-native access to BigQuery datasets via simple, URL-routed endpoints. By abstracting petabyte-scale complexity behind a standardized OData V4 interface, the gateway enables seamless data discovery while enforcing strict, multi-tenant architectural isolation.

### What Makes This Special

This solution is unique in its support for a **Trusted Subsystem** security model that collapses the "Identity Barrier" between cross-cloud ecosystems. It verify identities via OIDC (O365/Entra ID) and governs access based on internal rules, fetching data from BigQuery via a secure master service account. This "Application-as-Proxy" pattern allows for instant data democratization without waiting for multi-cloud IAM synchronization. It also features a proactive **"Dry-Run" Circuit Breaker** that audits and enforces scan budgets *before* query execution, preventing catastrophic cost leakage.

## Project Classification

- **Project Type:** API Backend / Data Gateway
- **Domain:** Data Infrastructure / Enterprise Analytics
- **Complexity:** High (BigQuery scale, billing protection, OIDC integration)
- **Project Context:** Greenfield (New product development)

## Success Criteria

### User Success

- **Frictionless Onboarding:** 100% of users connect and refresh their first dataset in **< 30 seconds**.
- **Self-Service Discovery:** 100% of authorized BigQuery tables are automatically visible in the Excel/Power BI Navigator.

### Business Success

- **SQL Tax Abolition:** 80% reduction in ad-hoc SQL query requests within the first 90 days of deployment.
- **Zero Cost Leakage:** $0.00 spent on un-audited scans, enforced by mandatory pre-execution Dry Runs.
- **Catalog Adoption:** Successful multi-tenant deployment across at least 3 distinct business departments.

### Technical Success

- **Metadata Performance:** Discovery latency of **< 2 seconds** for the OData $metadata response.
- **Data Integrity:** 100% fidelity in BigQuery-to-OData type mapping; nested structures handled as JSON strings.

### Measurable Outcomes

- **Target Query Success Rate:** > 99% of valid OData queries pass the Dry-Run audit.
- **Server Footprint:** Maintain a near-zero memory footprint (< 256MB) by streaming 100% of results.

## Product Scope

### MVP - Minimum Viable Product (Phase 1)

- **Core Routing:** URL-based hierarchical routing (`/v1/:projectId/:datasetId`).
- **Security:** Implementation of **Trusted Subsystem** (App-governed) workflow with OIDC identity verification.
- **Auto-Discovery:** Automatic bootstrapping and 24h periodic refresh of the OData EDM schema.
- **Basic Querying:** OData V4 filtering, sorting, and paging mapped to BigQuery via `odata-v4-sql`.
- **Cost Protection:** Mandatory pre-execution BigQuery Dry Run with a fixed 10GB scan limit.
- **Nested Data:** Automatic `TO_JSON_STRING` casting for BigQuery RECORD and REPEATED types.

### Growth Features (Phase 2)

- **Operational Governance:** Configurable user/project scan-budgets and usage reporting (`/admin/usage`).
- **Advanced Joins:** Support for OData `$expand` via an explicit `relationships.json` manifest.
- **Analytics Push-down:** Support for OData `$apply` for native BigQuery aggregations.
- **Smart Paging:** Job-ID based query cursors to reuse BigQuery results for subsequent OData pages.

### Vision (Phase 3)

- **AI Ecosystem:** Specialized protocol shims for Microsoft Copilot agents.
- **Catalog UI:** A web-based "Data Catalog" for searching and discovering authorized endpoints.
- **OData Query Builder:** A beautiful web-based step-by-step query construction form. Users select tables, dynamic relationship joins ($expand), select projected fields, set groupings, map aggregations, define sort orders, set top-capping limits, and automatically compile valid OData URLs with one-click Excel/PowerBI connection files.

## User Journeys

### Sarah: The Step-by-Step Query Explorer
**Situation:** Sarah is exploring a new insurance dataset and needs to retrieve fields from both the `Policies` table and its related `Customers` table.
**Goal:** Build a complex OData query and export an Excel connection file without writing any SQL or OData syntax by hand.
**Outcome:** Sarah opens the OData Query Builder. She selects `Policies` as her primary table in Step 1, adds a relationship join to `Customers` in Step 2, and in Step 3 she selects the exact projected columns she needs from both tables using the high-density grid and search filter. The builder automatically compiles her service URL and generates an Excel connection file in Step 8.

### Elena: The Frictionless Discovery
**Situation:** Elena needs a "Region vs. Sales" report by 10 AM. Traditionally, this requires a manual SQL export from a Data Engineer.
**Goal:** Access real-time sales data directly in Excel without waiting for IT.
**Outcome:** Elena uses the project-specific OData URL. The gateway verifies her O365 identity and authorizes her instantly based on internal data access rules. Within 30 seconds, she is browsing the BigQuery tables in the Excel Navigator and loading BigQuery data into a pivot table. Her report is finished by 9:15 AM.

### David: The Agile Governance
**Situation:** David needs to grant the "Marketing Analytics" team temporary access to a new dataset, but the GCP IAM update process takes 48 hours.
**Goal:** Provide secure, immediate data access without waiting for GCP IAM changes.
**Outcome:** David adds the Marketing team's OIDC groups to the gateway's internal access rules. The team can now query the data immediately through the gateway's master account, while David maintains full visibility and control over their usage via the gateway's audit logs.

### Journey Requirements Summary

- **Query Construction:** Step-by-step query builder supporting dynamic table selections, relationship joins ($expand), granular column projections, sorting, and row limits.
- **Discovery:** $metadata response < 2s; support for Excel/Power BI connector quirks.
- **Budget/Ops:** Pre-execution Dry Run middleware; configurable per-URL scan limits.
- **Security:** OIDC identity verification; internal rule-based authorization; master-account execution.
- **Data Fidelity:** Automatic TO_JSON_STRING transformation for nested records.

## Domain-Specific Requirements

### Compliance & Regulatory
- **Stateless Audit Traceability:** Every OData request must inject a `correlation_id` and the verified `user_identity` into BigQuery Job **Labels** for non-repudiation in GCP Audit Logs.
- **Identity Integrity:** The gateway must log the verified user identity alongside every query executed via the master account.

### Technical Constraints
- **Regional Chameleon Pattern:** Gateway must dynamically detect dataset locations and instantiate regionalized BigQuery clients to ensure residency compliance.
- **Dry-Run Enforcement:** 100% of data-fetch requests must pass a mandatory pre-execution Dry Run.
- **Data Sovereignty:** Ensure OData requests are routed to regional endpoints matching BigQuery residency rules.

### Risk Mitigations
- **Cartesian Join Circuit Breaker:** Hard-coded "Strict-ON" requirement for all joins, validated against the Relationship Manifest.
- **Internal Access Rule Reliability:** In-memory rule evaluation to ensure authorization overhead is minimal.

## Innovation & Novel Patterns

- **Trusted Subsystem Governance:** Rapid data democratization by decoupling application-level access from cloud-provider IAM latency.
- **Dry-Run Circuit Breaker:** Proactive "Financial Safety Valve" leveraging native BigQuery estimation as a protocol-level gatekeeper.
- **Hierarchical Multi-Tenancy:** Routing paradigm transforming complex GCP hierarchies into human-readable OData endpoints.

## API Backend / Data Gateway Specific Requirements

### Technical Architecture Considerations

#### Endpoint Specification
- **Primary Data Service:** `/v1/:projectId/:datasetId/` (OData V4 root).
- **Operational Endpoints:** `GET /health`, `POST /admin/refresh`, `GET /admin/usage`.
- **Developer Tooling:** Support for `?$explain=true` to return generated SQL and Dry-Run estimates.

#### Authentication & Identity Model
- **Provider Support:** Universal OIDC-compliant integration (Entra ID, Google Cloud Identity priority).
- **Authorization Model:** exclusive `TrustedSubsystem` (App-governed access via master service account).

#### Data Schemas & Formats
- **Protocol:** OData V4 (JSON-only; `odata.metadata=minimal`).
- **Schema Discovery:** Automatic bootstrapping from BigQuery `INFORMATION_SCHEMA`.

#### Rate Limits & Operational Governance
- **Granular Throttling:** Configurable rate limits defined per project-URL.
- **Cost Enforcement:** Mandatory BigQuery Dry-Run with failure-on-exceed for scan budgets.

### Implementation Considerations
- **Metadata Caching:** Isolated LRU cache for EDM schemas to ensure discovery latency < 2s and prevent cross-tenant collisions.

## Functional Requirements

- **FR1:** Users can access independent "OData Services" via project-specific URL segments.
- **FR2:** Users can automatically discover OData EDM metadata upon connection.
- **FR3:** Admins can trigger immediate schema re-discovery via a management endpoint.
- **FR4:** The System maintains a sharded, in-memory cache of OData schemas, isolated by tenant-URL to prevent cross-tenant metadata collisions.
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
- **FR24:** The System implements a **Trusted Subsystem** mode workflow: 1. Verify Identity (OIDC), 2. Validate against App rules, 3. Fetch via service-level master account.
- **FR26:** The System shall provide deterministic OData error codes for operational failures, including `BudgetExceeded`, `QuotaThrottled`, and `Unauthorized`.
- **FR27:** The System shall provide a step-by-step OData Query Builder interface that enables users to configure primary tables, discover relationship joins ($expand), select projected fields, set grouping, map aggregations, configure sorting, and apply capping limits.
- **FR28:** The System shall support bi-directional navigation property discovery via recursive metadata searches, enabling dynamic column selections for all active joined relations ($expand).

## Non-Functional Requirements

### Performance
- **Discovery Latency:** OData `$metadata` responses < 2s for 95% of requests.
- **Rule Validation Latency:** Internal access rule checks for Trusted Subsystem mode must complete in **< 200ms**.
- **Resource Footprint:** **The System** must maintain a memory footprint < 256MB, ensured by mandatory 100% result streaming.
- **Query Builder Load Time:** The Query Builder page and step selectors shall load and parse cached BigQuery schemas in < 1s, verified by Server Action metadata payloads.
- **Metadata Decoupling:** Related expand metadata must be crawled asynchronously via Server Actions, ensuring that no extra overhead is bundled into the core OData V4 `$metadata` payload, preserving the < 2s discovery SLA.

### Security
- **Stateless Audit Integrity:** 100% of queries decorated with native Job Labels (user identity + correlation ID).
- **Metadata Auditability:** Because schema discovery and ERD navigation rely on cached data rather than BigQuery jobs, the gateway must emit standardized application-level audit logs for all `$metadata` and ERD manifest requests, recording the user identity and requested schema.
- **Transport Security:** Mandatory enforcement of TLS 1.3.

### Reliability
- **Service Availability:** 99.9% uptime during business hours; MTTR < 15 minutes.
- **Deterministic Error Handling:** Translation of GCP errors into standard OData V4 payloads using defined error codes.

### Scalability
- **Multi-Tenant Sprawl:** Support for 100+ concurrent tenant-URLs.
- **Connection Concurrency:** Support for at least 50 simultaneous data streams.

