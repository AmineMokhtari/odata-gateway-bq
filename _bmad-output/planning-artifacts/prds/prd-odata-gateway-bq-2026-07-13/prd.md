---
title: implementation of fetch_size in obq-gateway
status: final
created: 2026-07-13
updated: 2026-07-14
---

# Product Requirements Document

## 1. Vision & Goals
The primary vision for this feature is to make data loading from client tools like Excel and PowerBI as fast and reliable as possible. By implementing etch_size chunking within the obq-gateway, we aim to significantly reduce data loading time and prevent the gateway from crashing under heavy loads, ensuring a highly-available, production-grade integration with BigQuery.

## 2. Features and Capabilities

### 2.1 Configurable Default Fetch Size
The gateway must provide operators with the ability to set a default optimal chunk size (e.g., DEFAULT_FETCH_SIZE=10000) via environment variables. This allows operators to balance response latency against memory consumption dynamically without deploying code changes.

### 2.2 Enforced Server-Driven Paging
When a client requests a massive dataset (e.g., $top=1000000), the gateway must intercept the request and bound the immediate BigQuery stream to the etch_size limit. Instead of abruptly rejecting the request, the gateway must automatically generate an @odata.nextLink containing the remaining count. This seamlessly forces the client to paginate safely.

**Edge Case Handling (Non-Compliant Clients):** If a rogue or non-compliant client ignores the generated @odata.nextLink, they will simply receive a truncated dataset bounded by the etch_size. This aligns perfectly with the OData specification and ensures the gateway remains protected.

## 3. Non-Functional Requirements (NFRs)
- **Memory Constraint:** The gateway's memory footprint must remain strictly under 256MB under peak load, conforming to Cloud Run stateless limits.
- **Availability:** The system must achieve a 0% Out-Of-Memory (OOM) crash rate when handling massive dataset queries.

## 4. Success Metrics
- **Performance:** Time to First Byte (TTFB) for Excel/PowerBI must remain exceptionally low (under 1-2 seconds) to guarantee the appearance of immediate streaming.
- **Counter-Metric (API Overhead):** Track the number of sequential API calls made to BigQuery via the gateway's existing usage-audit logs to ensure etch_size is not set so low that it causes undue network latency overhead.
