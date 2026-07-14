---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: ["c:\github-project\odata-gateway-bq\_bmad-output\planning-artifacts\prds\prd-odata-gateway-bq-2026-07-13\prd.md", "c:\Users\amine_mokhtari\.gemini\antigravity-ide\brain\155be2f7-7843-4d4b-a83d-ea7a699dcd6e\implementation_plan.md"]
---

# odata-gateway-bq - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for odata-gateway-bq, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Provide a configurable DEFAULT_FETCH_SIZE (default 10,000) via environment variables to dynamically balance memory vs. latency.
FR2: Intercept large OData $top requests and bound the initial BigQuery stream to the fetch_size limit, returning the remaining count via an @odata.nextLink (Server-Driven Paging). Non-compliant clients that ignore the link will safely receive truncated datasets.

### NonFunctional Requirements

NFR1: Gateway memory footprint must remain strictly under 256MB under peak load (Cloud Run limit).
NFR2: 0% Out-Of-Memory (OOM) crash rate during massive queries.
NFR3: Time to First Byte (TTFB) for client tools must remain under 1-2 seconds.
NFR4: Track sequential API calls via usage-audit logs to monitor BigQuery API overhead.

### Additional Requirements

- Modify src/config.ts to add defaultFetchSize parsing logic.
- Modify src/routes/v1/index.ts to calculate pageSize, generate compliant nextLink that decrements $top.

### UX Design Requirements

(No UX design requirements)

### FR Coverage Map

FR1: Epic 1 - Configurable chunk size
FR2: Epic 1 - Server-Driven Paging and limits
NFR1: Epic 1 - Memory constraints
NFR2: Epic 1 - Availability / Crash prevention
NFR3: Epic 1 - Performance TTFB
NFR4: Epic 1 - Telemetry / API overhead tracking

## Epic List

### Epic 1: Resilient Data Extraction & Chunking Controls
*User Outcome:* Data analysts pulling massive datasets via Excel or Power BI receive their data reliably without crashing the gateway. Simultaneously, system operators gain dynamic configuration controls to balance memory limits against API overhead.
*Requirements covered:* FR1, FR2, NFR1, NFR2, NFR3, NFR4.

**Implementation Notes (Problem Decomposition):**
1. **Configuration:** Parse/expose DEFAULT_FETCH_SIZE falling back to 10,000.
2. **Request Interception:** Calculate cappedSize = Math.min(requestedTop, defaultFetchSize) for BigQuery maxResults.
3. **Paging State:** Compute equestedTop - cappedSize. If > 0, generate @odata.nextLink wrapping the BQ pagination token and the decremented $top.
4. **Telemetry:** Emit usage-audit logs on 
extLink generation to track API overhead.

**Risk Mitigation (Pre-mortem Insights):**
- **Wide Tables (OOM Risk):** Ensure testing includes extremely wide/dense tables to verify the 256MB limit. Note for operations that DEFAULT_FETCH_SIZE should be tuned down if tables are dense.
- **URL Length Limits:** Ensure the generated @odata.nextLink (including the BQ skiptoken) does not exceed ~2048 characters to prevent Excel/client truncation.
- **Snapshot Isolation:** Document that multi-chunk extraction on highly volatile mutating tables may yield phantom rows or minor inconsistencies due to BigQuery streaming behavior.

**Assumption Audit Insights:**
- **Opaque Token Integrity:** OData clients may improperly append $skip when following a 
extLink. To prevent state corruption, the routing logic must explicitly *ignore* client-provided $skip parameters if a BigQuery skiptoken is present in the request URL. The skiptoken is the absolute source of truth.

**Architecture Decision Record: Stateless Paging vs Spooling:**
- **Decision:** Use a purely stateless Proxy Pager (relying entirely on BigQuery maxResults and pageToken).
- **Rejected:** Executing the full query and spooling results into a fast cache (Redis/Storage) for instant 
extLink resolution.
- **Rationale:** Spooling violates the strict <256MB memory footprint and zero-state cloud run architecture. The minor latency tradeoff from sequential BigQuery API hits is entirely acceptable for analytical batch tools like Excel/PowerBI.

## Epic 1: Resilient Data Extraction & Chunking Controls

Data analysts pulling massive datasets via Excel or Power BI receive their data reliably without crashing the gateway. Simultaneously, system operators gain dynamic configuration controls to balance memory limits against API overhead.

### Story 1.1: Environment Configuration for Fetch Size

As a system operator,
I want to configure the default fetch size via environment variables,
So that I can dynamically tune the balance between memory footprint and API latency.

**Acceptance Criteria:**

**Given** the gateway initializes
**When** DEFAULT_FETCH_SIZE is defined in the environment
**Then** src/config.ts parses it as a numeric value
**And** if it is missing or invalid, it gracefully falls back to a default of 10000.

### Story 1.2: Server-Driven Stream Bounding

As a data analyst,
I want my massive OData queries to be automatically bounded to a safe chunk size,
So that the gateway doesn't crash with an OOM error while serving my data.

**Acceptance Criteria:**

**Given** an OData request with a $top parameter larger than defaultFetchSize
**When** the gateway processes the request in src/routes/v1/index.ts
**Then** the BigQuery stream engine is invoked with maxResults strictly capped to defaultFetchSize
**And** the immediate JSON payload returned is truncated to the capped size.

### Story 1.3: Opaque Pagination Link Generation

As a data analyst using tools like Power BI,
I want the API to provide a continuation link when data is truncated,
So that my client can automatically fetch the remaining data seamlessly.

**Acceptance Criteria:**

**Given** the gateway truncated a response in Story 1.2 (or the BQ stream naturally yielded a pageToken)
**When** assembling the final JSON response
**Then** an @odata.nextLink property is appended to the root
**And** the link encapsulates the BQ jobId, the absolute skiptoken, and the *decremented* $top count
**And** the routing logic explicitly *ignores* any client-provided $skip parameters if a skiptoken is present, enforcing opaque token integrity.
**And** the generated 
extLink URL length is verified to be under 2000 characters to prevent Excel truncation.

### Story 1.4: Telemetry for Multi-Chunk Paging

As a system operator,
I want visibility into when chunking occurs,
So that I can monitor if the DEFAULT_FETCH_SIZE is causing too much BigQuery API overhead.

**Acceptance Criteria:**

**Given** the gateway is processing an OData request
**When** a chunk is served and an @odata.nextLink is generated
**Then** a telemetry event is explicitly emitted to the standard usage-audit logs
**And** the log includes the jobId and an indicator that a pagination link was issued.

