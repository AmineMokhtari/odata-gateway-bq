# Release Notes

## Version 1.3.0 (Architecture Hardening & 1:N Expansion)
*Release Date: May 16, 2026*

This release introduces a major architectural hardening phase, migrating all metadata discovery to secure Server Actions and enabling full 1:N expansion support for complex data relationships.

### New Features
- **1:N Relationship Expansion**: Full support for "To-Many" relationships in the Step-by-Step Join Builder. The gateway now automatically identifies inbound Foreign Keys and uses BigQuery's nested `ARRAY` structures for high-fidelity data retrieval.
- **Server-Action Based Discovery**: Migrated all UI metadata, pulse checks, and cost auditing to Next.js Server Actions. This hides backend infrastructure from the client and ensures unified session propagation.
- **Identity-Job Binding**: Enhanced security isolation by binding BigQuery Job IDs to the user's OIDC identity via audit labels. This prevents unauthorized result resumption across different user sessions.

### Enhancements
- **Unified Gateway Client**: Centralized all server-to-backend communication in a robust, cookie-aware client (`GatewayClient`) with automatic correlation ID injection.
- **Server-Side XML Parsing**: Optimized OData metadata processing by moving XML-to-JSON transformation to the server layer using `fast-xml-parser`.
- **Relationship Discovery**: Refactored the metadata crawler to perform a bi-directional scan of BigQuery `INFORMATION_SCHEMA` for improved relationship mapping.

### How to Upgrade
This release contains internal architectural shifts. Ensure the `GATEWAY_URL` environment variable is correctly set in your Next.js environment. No breaking changes for end-users.


## Version 1.2.0 (Catalog Experience)
*Release Date: May 11, 2026*

This release focuses on professionalizing the data discovery journey through a full-width catalog interface and refined reactive guidance.

### New Features
- **Full-Width Catalog Layout**: Redesigned the Catalog and Connection Builder into a professional, responsive full-width interface aligned with the Google Cloud Console identity.
- **Branded Discovery Feedback**: Implemented centralized, branded loading states providing transparent progress during BigQuery metadata discovery.
- **"Elena" Advice Layer (Native Drawer)**: Integrated a reactive MD3-compliant drawer that triggers actionable "Elena Tips" for budget (403) and session (401) errors.
- **Google Cloud Design System**: Migrated the entire frontend to the Roboto font family and a curated Neutral/Primary color palette for a native platform feel.

### Enhancements
- **Hybrid LRU Metadata Cache**: Optimized backend performance with a sharded in-memory cache (`projectId:datasetId`) featuring a 24h sliding TTL.
- **Metadata Description Support**: Added support for surfacing BigQuery table and column descriptions directly in the UI.

### How to Upgrade
No breaking changes. The UI will automatically adopt the new full-width layout upon deployment.

## Version 1.1.0 (Self-Service Governance)
*Release Date: May 09, 2026*

This release introduces the **"Elena" Experience**—a set of features designed to empower non-technical users with advanced data building and governance capabilities.

### New Features
- **Usage Hub (User Consumption Tracking):** Real-time dashboard for users to track their personal monthly BigQuery consumption and job history.
- **Step-by-Step Join Builder (`$expand`):** Automatic discovery of foreign key relationships allowing users to build complex joins step-by-step.
- **Form-Based Aggregation Builder (`$apply`):** Interactive UI for building GroupBy and Aggregate queries without knowing OData syntax.
- **"Elena Tips" Finalized Integration:** Reactive slide-out guidance for 403 (Budget Exceeded) and 401 (Authentication) errors.
- **Catalog UI Streamlining:** Cleaned up navigation, removed redundant sidebars, and optimized for high-density data discovery.
- **Identity Pill (Top Bar):** Persistent, high-visibility security status pill in the navigation bar.
- **Secure Identity Propagation:** Architectural shift to server-to-client identity prop for enhanced security boundaries.
- **Decoupled Billing (Enterprise Mode):** Support for `BQ_BILLING_PROJECT_ID` to separate query execution costs from source data projects.
- **Feature Toggle (Query Builder):** New `ENABLE_QUERY_BUILDER` toggle to hide/show advanced data building tools.

### Enhancements
- **Enhanced Introspection:** Added cross-project metadata crawling support.
- **UI Polishing:** Premium visual feedback for data builders and consumption gauges.

### Known Limitations
- Usage auditing requires `roles/bigquery.jobUser` in the centralized billing project.
- Visual Joins currently support 1:1 and 1:N relationships via standard constraints.

## Version 1.0.0 (Initial MVP)
*Release Date: April 25, 2026*

The initial launch of the **OData Gateway for BigQuery** focuses on enabling secure, governed data democratization for Excel and Power BI users.

### New Features
- **URL-Based Routing:** Access independent BigQuery datasets via easy-to-use URL segments: `/v1/:projectId/:datasetId`.
- **Trusted Subsystem Security:** Integrated OIDC authentication (Microsoft Entra ID / O365) with application-level authorization rules.
- **Cost Protection (Dry-Run):** Every query is estimated before execution. Queries exceeding the 10GB scan budget are automatically blocked to prevent cost spikes.
- **OData V4 Compatibility:** Support for standard OData filtering (`$filter`), sorting (`$orderby`), and paging.
- **Automatic Schema Discovery:** Real-time generation of OData metadata from BigQuery table structures.
- **Live Discovery Fallback:** Instant access to newly created tables through on-demand metadata introspection, bypassing the 24h cache when needed.
- **Nested Data Support:** Automatic conversion of BigQuery `RECORD` and `REPEATED` types into manageable JSON strings.
- **Zero-Footprint Streaming:** Results are streamed directly from BigQuery to the client, ensuring high performance and low server memory usage.

### Known Limitations
- Metadata discovery currently refreshes every 24 hours.
- Advanced table joins (`$expand`) require manual configuration in the backend manifest.
- Custom scan budgets are currently configured via backend configuration files only.

### How to Upgrade
As this is the initial release, no upgrade steps are required. Simply deploy the service and share the URLs with your users.

