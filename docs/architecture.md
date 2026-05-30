# System Architecture Documentation

This document describes the high-level architecture, data flow, and security model of the **odata-gateway-bq**.

## Executive Summary
The **odata-gateway-bq** is a production-grade OData V4 gateway designed to provide protocol-native access to BigQuery datasets. It is built specifically for the **'Elena' Persona**—business analysts who need secure, high-performance data access without knowing SQL or Python. The system abstracts BigQuery complexity behind a standardized OData interface, enabling seamless integration with Excel and Power BI while enforcing strict financial and security governance.

## The 'Elena' North Star
Every architectural decision is guided by our primary persona:
- **Zero-Knowledge UX**: Transforming BigQuery technical errors into "Elena Tips" (narrative advice).
- **Self-Service Governance**: Empowering users to configure tables, dynamic relationship joins ($expand), select projected fields, and map aggregation functions without writing OData syntax (Optional: Toggled via `ENABLE_QUERY_BUILDER`).
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

### Frontend Integration (Server Actions)
The Next.js frontend utilizes **Server Actions** to route all data discovery and governance requests (Metadata, Pulse Checks, Explain Audits) to the Fastify backend. This architecture hides the backend infrastructure from the client, ensures unified session propagation via the `GatewayClient`, and avoids CORS complexity.

### Request Pipeline (The "Audit-Execute" Pattern)
1. **Identify:** Extract and verify OIDC token or offloaded headers (Anonymous Mode).
2. **Authorize:** Validate user against internal `tenants.yaml` rules (Email/Group membership).
3. **Translate:** Transform OData query parameters into optimized BigQuery SQL using the `odata-v4-gcp` engine. This engine supports BigQuery-native optimizations like `ARRAY(SELECT AS STRUCT ...)` sub-queries for 1:N expansions and `SEARCH()` for full-text.
4. **Audit (Pre-flight):** Execute a BigQuery Dry-Run with full parameterization to estimate the scan cost.
5. **Gate:** Block execution if the estimate exceeds the tenant's configured `scan_budget_gb`.
6. **Execute:** Run the query using a master service account with regionalized clients, passing parameters natively to prevent injection.
7. **Stream:** Transform BigQuery rows into OData JSON envelopes and stream to the client.

### The 'Elena' Advice Layer (Error Decoration)
The system implements a non-intrusive guidance layer that intercepts technical BigQuery and Security errors:
1. **Intercept:** A global `onSend` hook in Fastify detects `401`, `403`, and `500` status codes.
2. **Decorate:** The `elena-tips` plugin injects an `elena_tip` object into the JSON error response, providing a narrative explanation and a list of `quick_fixes`.
3. **Trigger:** Next.js Server Actions capture these decorated errors and return them to the UI, which automatically opens the `ElenaDrawer`.

## Data Architecture
### Metadata Management
- **Introspection:** Dynamically crawls `INFORMATION_SCHEMA` to build the OData Entity Data Model (EDM). This includes a **bi-directional Foreign Key scan** to support both N:1 and 1:N (Collection) relationships.
- **Annotations:** Descriptions are mapped to standard OData annotations (`Org.OData.Core.V1.Description`), allowing BI tools and our catalog UI to surface data definitions natively.
- **Caching:** Uses a sharded in-memory LRU cache (`projectId:datasetId` keys) with a 24-hour TTL to ensure sub-2s discovery latency.
- **Type Casting:** Automatically applies `TO_JSON_STRING()` to BigQuery `RECORD` and `REPEATED` types to ensure lossless transport of nested structures.

## Security Model
- **Trusted Subsystem:** The gateway acts as a secure proxy. Users never interact with BigQuery IAM directly; all BigQuery operations are performed via a central Master Service Account.
- **Deny-by-Default:** Access is strictly controlled by explicit rules in `tenants.yaml`. If no rules match, the request is rejected with a `403 Unauthorized`.
- **Identity-Job Isolation:** Verified user identities are injected into BigQuery Job Labels. The gateway enforces strict isolation, ensuring that users can only access the results of BigQuery jobs they personally initiated.

### Identity Provider Integration (Entra ID)
When integrating with Microsoft Entra ID for Power BI and Excel clients, the system architecture mandates strict resource principal alignment to pass OIDC token validation:
- **Custom Domains Required:** Entra ID does not support raw IP addresses or `localhost` (in some contexts) as valid Application ID URIs for organizational account flows. The gateway must be deployed behind a valid, trusted custom domain (e.g., `https://odata.yourcompany.com` or `local.odatabq.com` for local DNS).
- **Resource Principal Alignment:** The App Registration's **Application ID URI** (exposed API) must exactly match the `OIDC_AUDIENCE` configured in the gateway. A mismatch or missing URI will result in token rejection (e.g., `AADSTS500011: invalid_resource`) during Power BI's authentication handshake.

## Deployment Architecture
- **Primary Target:** Google Cloud Run (Regional serverless containers).
- **Decoupled Billing (Enterprise Mode):** Supports a dedicated **Billing Project** (`BQ_BILLING_PROJECT_ID`). This allows the gateway to run queries in a centralized "Execution" project while reading data from decentralized "Source" projects.
- **Scale:** Stateless design allows for horizontal scaling across multiple instances.
- **Configuration:** Supports dynamic config loading from shared file systems or GCS buckets, with hot-reloading capabilities.

## Reliability & Operational Integrity
- **Graceful Shutdown:** The system natively handles `SIGTERM` signals. When a shutdown is initiated, the gateway stops accepting new requests but stays alive to finish streaming data for all active connections.
- **Job Lifecycle Management:** To prevent financial leakage, the gateway monitors every active connection. If a client disconnects prematurely (e.g., closing Excel during a refresh), the system catches the `ERR_STREAM_PREMATURE_CLOSE` error and automatically sends a cancellation signal to the corresponding BigQuery job.
- **Deterministic Error Codes:** System failures are translated into standard OData error codes (e.g., `BudgetExceeded`, `Unauthorized`) to ensure compatible error handling in Excel and Power BI.

## Persistent Auditing & Observability

To maintain a secure, auditable, and cost-transparent pipeline, the gateway implements a dual-layer observability system:

### 1. High-Performance Real-Time Logging (Write-Path)
Every gateway event (including dataset queries, tenant active pulses, and schema refreshes) is recorded in real-time.
* **Storage Write API:** To avoid blocking query execution or response times, the gateway uses the **BigQuery Storage Write API** (default stream) via Protocol Buffers (`proto3`). This performs high-throughput binary serialization rather than JSON-based batching.
* **Target Table:** Events are persisted in `api_audit` (located in the configured `obq_audit_logs` dataset).
* **Protobuf Schema:** Streamed payloads strictly follow the `AuditEvent` schema:
  * `timestamp` (ISO 8601 string)
  * `projectId` & `datasetId` (Target resource identification)
  * `userEmail` (User identity mapped from OIDC)
  * `correlationId` (Correlation ID matching the Fastify request tracer)
  * `action` (`'QUERY' | 'METADATA_REFRESH' | 'PULSE'`)
  * `bytesProcessed` (Estimated scanned bytes)
  * `status` (`'SUCCESS' | 'FAILURE'`)

### 2. Preventive Budget Gating vs. Historical Usage Reporting
The gateway strictly segregates **preventive enforcement** from **observability reporting** to ensure cost control without database lag:

* **Preventive Enforcement (Per-Query dry-run):**
  When a query is received, the gateway evaluates the query structure using a BigQuery **Dry Run** (via [dry-run-gate.ts](file:///home/amine_mokhtari/projects/odata-gateway-bq/obq-gateway/src/middleware/audit/dry-run-gate.ts)). This pre-flight check returns estimated bytes to scan. If the estimate exceeds the tenant's single-query budget limit (e.g., `scan_budget_gb` in `tenants.yaml`), the query is actively blocked before execution. **The cumulative monthly quota does not block the query; enforcement is strictly per-query.**
  
* **Observability Reporting (Personal Usage Hub):**
  To power the dashboard metrics in the frontend, the gateway queries both custom and native logs:
  * **Monthly Volume Consumed (Local Project):** Calculated dynamically via BigQuery's native `INFORMATION_SCHEMA.JOBS_BY_PROJECT` by searching for jobs with the label `user_identity` matching the user's email.
  * **Monthly Volume Consumed (Global cross-project):** Calculated by summing `bytesProcessed` in the custom `api_audit` table.
  * **Activity History:** Fetches the last 10 (or 50) recent jobs directly from the custom `api_audit` table, showing user actions and correlation IDs.


