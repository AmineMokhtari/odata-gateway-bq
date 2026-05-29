# Documentation Index

Welcome to the technical documentation for the **odata-gateway-bq**. This guide is organized into several sections to help you understand the architecture, API, and operational procedures.

## Core Documentation

- **[Project Overview](./project-overview.md)** - High-level summary of goals, value propositions, and repository structure.
- **[System Architecture](./architecture.md)** - Detailed design of the Audit-Execute pipeline, security model, and BigQuery integration.
- **[Source Tree Analysis](./source-tree-analysis.md)** - Annotated directory structure and critical entry points.

## API & Data

- **[API Contracts](./api-contracts.md)** - Catalog of OData v4 endpoints, governance routes, and administrative controls.
- **[Data Models](./data-models.md)** - Definition of the core domain objects used across the system.

## Guides & Operations

- **[Getting Started](./getting-started.md)** - End-user guide for connecting Excel and Power BI to the gateway.
- **[Onboarding Guide](./onboarding-guide.md)** - Developer-focused setup guide for fresh environment initialization.
- **[Deployment Guide](./deployment-guide.md)** - Operational instructions for Cloud Run, Docker, and CI/CD.
- **[Configuration](./configuration.md)** - Deep dive into `tenants.yaml` and environment variable hardening.
- **[Troubleshooting](./troubleshooting.md)** - FAQ and common error resolution strategies.

## Project Management

- **[Tasks](./tasks.md)** - High-level roadmap and feature tracking.
- **[Release Notes](./release-notes.md)** - Log of major architectural shifts and feature additions.
- **[Knowledge Base](./knowledge-base.md)** - Collection of distilled technical decisions and research.
- **[Project Scan Report](./project-scan-report.json)** - Machine-readable state of the latest project documentation scan.

## Deep-Dive Documentation

Detailed exhaustive analysis of specific areas:
- [Recent Commits Deep-Dive](./deep-dive-recent-commits.md) - Comprehensive analysis of direct OData exports, PBIDS connection schema fixes, visual PK/FK schema badges, Usage Hub, Catalog UI, API Proxy, and Elena Tips - Generated 2026-05-29
- [Core Gateway & Governance Deep-Dive](./deep-dive-core-gateway-governance.md) - Comprehensive analysis of OData translation, budget enforcement, and Elena Tips (7 files, 1949 LOC) - Generated 2026-05-13

---
*Last updated: 2026-05-29*
Deep-Dives: 2

