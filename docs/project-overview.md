# Project Overview: odata-gateway-bq

## Introduction
The **odata-gateway-bq** is a high-performance data gateway that bridges the gap between Google Cloud BigQuery and OData-consuming applications. It is specifically designed to eliminate the "SQL Tax" for business users, allowing them to access real-time enterprise data directly from tools like Excel and Power BI without requiring manual exports or specialized SQL knowledge.

## Executive Summary
This project transforms a BigQuery lakehouse into a governed **Data Marketplace**. By providing a standardized OData V4 interface, it enables frictionless data discovery while maintaining strict multi-tenant isolation and financial protection.

## Core Value Propositions
- **Frictionless Discovery:** Automatic introspection of BigQuery datasets to generate OData metadata.
- **Live Discovery Fallback:** On-demand check for tables missing from the cache, ensuring instant access to new data.
- **Zero Cost Leakage:** A proactive "Dry-Run" circuit breaker that enforces scan budgets *before* query execution.
- **Zero Trust Security:** Secure identity verification via OIDC (Azure AD/Entra ID) with app-level data access rules.
- **Enterprise Scale:** Near-zero memory footprint (< 256MB) achieved through 100% result streaming.
- **Native BQ Optimization:** Custom `odata-v4-gcp` engine for high-performance sub-queries and parameterized safety.

## Repository Structure
- **Type:** Monolith
- **Architecture:** Layered API Gateway / Data Proxy
- **Framework:** Fastify (Node.js/TypeScript)

## Key Components
- **API Surface:** OData V1 endpoints for data and metadata access.
- **Governance Layer:** Admin endpoints for usage tracking and configuration reloading.
- **Processing Engine:** Hand-written `odata-v4-gcp` SQL generator with full parameterization.
- **Security Plugin:** OIDC and anonymous mode authentication.

## Documentation Index
- [System Architecture](./architecture.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [API Contracts](./api-contracts.md)
- [Data Models](./data-models.md)
- [Development Guide](./development-guide.md)
- [Deployment Guide](./deployment-guide.md)
