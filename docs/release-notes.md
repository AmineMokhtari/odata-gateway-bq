# Release Notes

## Version 1.1.0 (Self-Service Governance)
*Release Date: May 09, 2026*

This release introduces the **"Elena" Experience**—a set of features designed to empower non-technical users with advanced data building and governance capabilities.

### New Features
- **Usage Hub (User Consumption Tracking):** Real-time dashboard for users to track their personal monthly BigQuery consumption and job history.
- **Visual Join Builder (`$expand`):** Automatic discovery of foreign key relationships allowing users to build complex joins visually.
- **Visual Aggregation Builder (`$apply`):** Interactive UI for building GroupBy and Aggregate queries without knowing OData syntax.
- **"Elena Tips" Finalized Integration:** Reactive slide-out guidance for 403 (Budget Exceeded) and 401 (Authentication) errors.
- **Marketplace UI Streamlining:** Cleaned up navigation, removed redundant sidebars, and optimized for high-density data discovery.
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
