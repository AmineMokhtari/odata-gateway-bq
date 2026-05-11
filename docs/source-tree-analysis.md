# Source Tree Analysis

This document provides an annotated overview of the **odata-gateway-bq** project structure, highlighting critical directories and application entry points.

## Project Structure

```text
odata-gateway-bq/
├── backend/                 # API Gateway Service (Fastify)
│   ├── config/              # Tenant configuration (tenants.yaml)
│   ├── src/
│   │   ├── app.ts           # Service entry point
│   │   ├── plugins/
│   │   │   ├── bq-client.ts # Support for BQ_BILLING_PROJECT_ID
│   │   │   └── auth.ts      # OIDC & Anonymous auth
│   │   ├── routes/v1/       # OData API surface
│   │   └── services/
│   │       ├── usage-audit.ts # Consumption tracking logic
│   │       ├── bq-introspection.ts # FK relationship discovery
│   │       └── odata-metadata.ts # $metadata XML generator
├── frontend/                # Catalog UI (Next.js)
│   ├── src/
│   │   ├── app/             # Application routes
│   │   │   ├── catalog/
│   │   │   │   ├── ODataUrlBuilder.tsx # Visual Join & Aggregation UI
│   │   │   │   ├── UsageDashboard.tsx # Personal Consumption Hub
│   │   │   │   └── ElenaAdviceCard.tsx # Narrative Error UI
│   │   │   └── ui/          # Shared Shadcn components
│   │   └── lib/
│   │       └── error-mapping.ts # Technical to Narrative mapping
├── odata-v4-gcp/            # Custom OData V4 to BQ Engine (TS)
│   ├── src/
│   │   ├── lexer.ts         # Tokenizer
│   │   ├── parser.ts        # Recursive Descent Parser
│   │   └── translator.ts    # Visitor-based SQL Generator
├── common/                  # Shared TypeScript types and schemas
├── docs/                    # Technical documentation
└── CONTRIBUTING.md          # Persona and Workflow guide
```

## Critical Folders Summary

| Folder | Purpose |
| --- | --- |
| `src/plugins/` | Core system services and shared infrastructure components. |
| `src/routes/v1/` | Primary OData API surface and request handler. |
| `src/lib/` | The "brains" of the protocol translation (OData -> SQL -> OData). |
| `src/middleware/` | The governance layer enforcing security and financial budgets. |
| `src/services/` | Direct interactions with Google Cloud BigQuery APIs. |
| `config/` | Externalized multi-tenant routing and authorization rules. |
| `odata-v4-gcp/` | Independent library for protocol translation with 100% parameterization. |

## Application Entry Points

- **Application Bootstrap:** `src/app.ts` - Initializes the Fastify instance and auto-loads all plugins and routes.
- **Service Root:** `GET /v1/:projectId/:datasetId` - Entry point for OData navigators.
- **Metadata:** `GET /v1/:projectId/:datasetId/$metadata` - Technical schema discovery for Excel/Power BI.
- **Data Fetch:** `GET /v1/:projectId/:datasetId/:entitySet` - High-throughput data streaming path.

