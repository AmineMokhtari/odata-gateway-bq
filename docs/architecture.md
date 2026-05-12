# System Architecture Documentation

This document describes the high-level architecture, data flow, and security model of the **odata-gateway-bq**.

## Executive Summary
The **odata-gateway-bq** is a production-grade OData V4 gateway designed to provide protocol-native access to BigQuery datasets. It is built specifically for the **'Elena' Persona**—business analysts who need secure, high-performance data access without knowing SQL or Python. The system abstracts BigQuery complexity behind a standardized OData interface, enabling seamless integration with Excel and Power BI while enforcing strict financial and security governance.

## The 'Elena' North Star
Every architectural decision is guided by our primary persona:
- **Zero-Knowledge UX**: Transforming BigQuery technical errors into "Elena Tips" (narrative advice).
- **Self-Service Governance**: Empowering users to build complex joins and aggregations visually without writing OData syntax (Optional: Toggled via `ENABLE_QUERY_BUILDER`).
- **Consumption Transparency**: Providing a real-time Usage Hub so business users can manage their own data footprint.

## Technology Stack
- **Framework:** Fastify v5 (Asynchronous, performance-oriented)
- **Language:** TypeScript 5.9 (ESM)
- **Primary Data Source:** Google Cloud BigQuery
- **Protocol Translation:** `odata-v4-gcp` (Custom hand-written engine)
- **Identity:** OIDC / Entra ID (via `jose`)
- **Logging:** `pino` with Correlation ID tracking

## Architecture Pattern
The system follows a **Layered API Gateway / Data Proxy** pattern with a **Trusted Subsystem** security model.

### Frontend Integration (API Proxy Bridge)
The Next.js frontend utilizes a built-in proxy bridge (`/web/api/gateway/*`) to route all client-side data discovery requests directly to the Fastify backend. This architecture circumvents CORS limitations and ensures the Catalog UI and One-Click Excel integration flows can safely request OData metadata without exposing direct backend ports to the browser.

### Request Pipeline (The "Audit-Execute" Pattern)
1. **Identify:** Extract and verify OIDC token or offloaded headers (Anonymous Mode).
2. **Authorize:** Validate user against internal `tenants.yaml` rules (Email/Group membership).
3. **Translate:** Transform OData query parameters into optimized BigQuery SQL using the `odata-v4-gcp` engine. This engine supports BigQuery-native optimizations like `ARRAY` sub-queries for expands and `SEARCH()` for full-text.
4. **Audit (Pre-flight):** Execute a BigQuery Dry-Run with full parameterization to estimate the scan cost.
5. **Gate:** Block execution if the estimate exceeds the tenant's configured `scan_budget_gb`.
6. **Execute:** Run the query using a master service account with regionalized clients, passing parameters natively to prevent injection.
7. **Stream:** Transform BigQuery rows into OData JSON envelopes and stream to the client.

### The 'Elena' Advice Layer (Error Decoration)
The system implements a non-intrusive guidance layer that intercepts technical BigQuery and Security errors:
1. **Intercept:** A global `onSend` hook in Fastify detects `401`, `403`, and `500` status codes.
2. **Decorate:** The `elena-tips` plugin injects an `elena_tip` object into the JSON error response, providing a narrative explanation and a list of `quick_fixes`.
3. **Trigger:** The frontend detects decorated errors and automatically opens the `ElenaDrawer`, presenting the user with actionable buttons (e.g., "Select fewer columns" or "Refresh Session").

## Data Architecture
### Metadata Management
- **Introspection:** Dynamically crawls `INFORMATION_SCHEMA` to build the OData Entity Data Model (EDM). This now includes fetching table and column descriptions for enhanced discoverability.
- **Annotations:** Descriptions are mapped to standard OData annotations (`Org.OData.Core.V1.Description`), allowing BI tools and our catalog UI to surface data definitions natively.
- **Caching:** Uses a sharded in-memory LRU cache (`projectId:datasetId` keys) with a 24-hour TTL to ensure sub-2s discovery latency.
- **Live Discovery Fallback:** If a requested table is missing from the cache, the gateway performs a targeted check against `INFORMATION_SCHEMA`. If found, the cache and the OData `$metadata` are automatically updated, allowing for near-instant access to newly created BigQuery tables without a full server restart.
- **Type Casting:** Automatically applies `TO_JSON_STRING()` to BigQuery `RECORD` and `REPEATED` types to ensure lossless transport of nested structures.

## Security Model
- **Trusted Subsystem:** The gateway acts as a secure proxy. Users never interact with BigQuery IAM directly; all BigQuery operations are performed via a central Master Service Account.
- **Deny-by-Default:** Access is strictly controlled by explicit rules in `tenants.yaml`. If no rules match, the request is rejected with a `403 Unauthorized`.
- **Audit Traceability:** Verified user identities are injected into BigQuery Job Labels, providing a permanent audit trail in GCP logs.

## Deployment Architecture
- **Primary Target:** Google Cloud Run (Regional serverless containers).
- **Decoupled Billing (Enterprise Mode):** Supports a dedicated **Billing Project** (`BQ_BILLING_PROJECT_ID`). This allows the gateway to run queries in a centralized "Execution" project while reading data from decentralized "Source" projects.
- **Scale:** Stateless design allows for horizontal scaling across multiple instances.
- **Configuration:** Supports dynamic config loading from shared file systems or GCS buckets, with hot-reloading capabilities.

## Reliability & Operational Integrity
- **Graceful Shutdown:** The system natively handles `SIGTERM` signals. When a shutdown is initiated, the gateway stops accepting new requests but stays alive to finish streaming data for all active connections.
- **Job Lifecycle Management:** To prevent financial leakage, the gateway monitors every active connection. If a client disconnects prematurely (e.g., closing Excel during a refresh), the system catches the `ERR_STREAM_PREMATURE_CLOSE` error and automatically sends a cancellation signal to the corresponding BigQuery job.
- **Deterministic Error Codes:** System failures are translated into standard OData error codes (e.g., `BudgetExceeded`, `Unauthorized`) to ensure compatible error handling in Excel and Power BI.

