# Project Overview: odata-gateway-bq

## Introduction
The **odata-gateway-bq** is a high-performance data gateway that bridges the gap between Google Cloud BigQuery and OData-consuming applications. It is specifically designed to eliminate the "SQL Tax" for business users, allowing them to access real-time enterprise data directly from tools like Excel and Power BI without requiring manual exports or specialized SQL knowledge.

## Executive Summary
This project transforms a BigQuery lakehouse into a governed **Data Catalog**. By providing a standardized OData V4 interface, it enables frictionless data discovery while maintaining strict multi-tenant isolation and financial protection.

## Core Value Propositions
- **The "Elena" Experience:** Reactive advice layer that transforms technical errors into actionable guidance via the "Elena Drawer".
- **Professional Catalog UI:** Full-width discovery interface aligned with Google Cloud Console aesthetics for a premium user experience.
- **Frictionless Discovery:** Automatic introspection of BigQuery datasets to generate OData metadata.
- **Personal Usage Hub:** A self-service dashboard for users to track their personal BigQuery consumption against their monthly limits.
- **Hybrid LRU Caching:** Sub-2s metadata retrieval via sharded in-memory caching with sliding TTL.
- **Zero Cost Leakage:** A proactive "Dry-Run" circuit breaker that enforces scan budgets *before* query execution.
- **Zero Trust Security:** Secure identity verification via OIDC (Azure AD/Entra ID) with app-level data access rules.
- **Enterprise Scale:** Near-zero memory footprint (< 256MB) achieved through 100% result streaming.
- **Native BQ Optimization:** Custom `odata-v4-gcp` engine for high-performance sub-queries and parameterized safety.

## Repository Structure
- **Type:** Monolith
- **Architecture:** Layered API Gateway / Data Proxy
- **Framework:** Fastify (Node.js/TypeScript)

## Key Components
- **Catalog UI:** Next.js based discovery portal with Visual Join Builder, One-Click Excel integration, and consumption dashboards.
- **API Proxy Bridge:** Next.js rewrites to proxy API requests securely to the backend, circumventing CORS and simplifying the connection UI.
- **Elena Advice Layer:** Global error decoration plugin and reactive drawer for actionable troubleshooting.
- **Processing Engine:** Hand-written `odata-v4-gcp` SQL generator with full parameterization.
- **Hybrid Cache:** Sharded metadata cache for high-concurrency discovery performance.
- **Security Plugin:** OIDC and anonymous mode authentication.

## Documentation Index
- [System Architecture](./architecture.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [API Contracts](./api-contracts.md)
- [Data Models](./data-models.md)
- [Development Guide](./development-guide.md)
- [Deployment Guide](./deployment-guide.md)

