# Documentation Index

Welcome to the technical documentation for the **odata-gateway-bq**. This documentation is organized according to the [Diátaxis framework](https://diataxis.fr/), splitting content into four distinct quadrants based on the user's needs.

## 1. Tutorials (Learning-Oriented)

*Tutorials help you achieve your first success safely. They are highly prescriptive and step-by-step.*

- **[Getting Started: Connecting to the Data Catalog](./tutorials/getting-started.md)** - Guide for end-users connecting Excel and Power BI for the first time.
- **[Local Developer Onboarding](./tutorials/local-onboarding.md)** - Guide for developers setting up a fresh local environment.

## 2. How-To Guides (Problem-Oriented)

*How-to guides are recipes that help you solve specific problems or achieve specific goals.*

- **[Deploying to Google Cloud Run](./guides/deployment.md)** - Actionable steps for CI/CD and Cloud Build deployment.
- **[Configuring Tenants and Access Rules](./guides/configuring-tenants.md)** - How to map BigQuery datasets to OData routes securely.
- **[Configuring Entra ID Authentication](./guides/configuring-entra-id.md)** - How to set up Azure AD / OIDC for production environments.
- **[Optimizing Queries with Query Folding](./guides/query-folding.md)** - How to filter large datasets visually without exceeding budgets.
- **[Troubleshooting Connection and Query Errors](./guides/troubleshooting.md)** - How to resolve common authentication and budget errors.

## 3. Reference (Information-Oriented)

*Reference material provides dry, factual information without explanations or instructions.*

- **[API Contracts](./reference/api-contracts.md)** - Catalog of OData v4 endpoints, governance routes, and admin controls.
- **[Configuration Flags & Schema](./reference/configuration-flags.md)** - Exhaustive list of environment variables and the `tenants.yaml` schema.
- **[Data Models](./reference/data-models.md)** - Definition of the core domain objects used across the system.
- **[Source Tree Analysis](./reference/source-tree.md)** - Annotated directory structure and file layout.
- **[Release Notes](./reference/release-notes.md)** - Changelog of major architectural shifts and feature additions.
- **[Project Scan Report](./reference/project-scan-report.json)** - Machine-readable state of the latest documentation scan.

## 4. Explanation & Architecture (Understanding-Oriented)

*Explanation provides context, architectural design decisions, and high-level understanding.*

- **[Project Overview](./architecture/project-overview.md)** - High-level summary of goals and value propositions.
- **[System Design & Architecture](./architecture/system-design.md)** - Detailed design of the Audit-Execute pipeline, security model, and BigQuery integration.
- **[Core Gateway Governance Deep-Dive](./architecture/core-governance.md)** - Comprehensive analysis of OData translation and budget enforcement.
- **[Recent Commits Deep-Dive](./architecture/recent-commits-analysis.md)** - Context on recent major feature additions (Catalog UI, PK/FK badges, Usage Hub).
- **[Knowledge Base](./architecture/knowledge-base.md)** - Collection of distilled technical decisions and research.

---

> [!NOTE]
> Project management and community guidelines are available at the root of the repository:
> - [Tasks](../tasks.md)
> - [Code of Conduct](../code-of-conduct.md)
