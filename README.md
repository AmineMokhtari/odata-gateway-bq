# 🚀 OData Gateway for BigQuery

### Unlock Your BigQuery Lakehouse for the Modern Enterprise.

[![Fastify](https://img.shields.io/badge/fastify-v5.0.0-black.svg?style=flat-square&logo=fastify)](https://www.fastify.io)
[![TypeScript](https://img.shields.io/badge/typescript-v5.9-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg?style=flat-square)](https://opensource.org/licenses/Apache-2.0)

---

## 🌟 What is it?
The **OData Gateway for BigQuery** is a production-grade, zero-trust data bridge that transforms your BigQuery datasets into a governed **Data Marketplace**. It allows business users to access petabyte-scale data directly from tools like **Microsoft Excel**, **Power BI**, and **Microsoft Copilot** using the standard OData V4 protocol.

### Who is it for?
*   **Data Engineers:** Who want to stop writing manual SQL exports and "SQL Tax" requests.
*   **Data Consumers:** (Analysts, Finance, Marketing) who need real-time data in their familiar spreadsheet environments.
*   **Architects:** Who need a secure, multi-tenant, and cost-controlled way to democratize data without exposing BigQuery IAM.
*   **Chief Data Officers (CDO):** Who need to maximize the ROI of their BigQuery investment by safely democratizing data access while maintaining strict governance and cost control.

---

## 💎 Why It Matters (Features & Benefits)

| Feature | Benefit |
| :--- | :--- |
| **Trusted Subsystem Security** | **Democratize Data Instantly.** Decouple app-access from cloud IAM. Verify users via O365/OIDC and authorize via internal rules without waiting 48h for cloud permission sync. |
| **Dry-Run Circuit Breaker** | **Zero Cost Leakage.** Every query is audited *before* execution. If a request exceeds your defined scan budget (e.g., 10GB), it is blocked automatically. |
| **Zero-Footprint Streaming** | **Infinite Scale.** Data is streamed directly from BigQuery to the client. The gateway maintains a near-zero memory footprint (< 256MB) even when handling millions of rows. |
| **Auto-Discovery (EDM)** | **Frictionless Onboarding.** The gateway automatically crawls your BigQuery schema. New tables appear in Excel/Power BI navigators automatically within 24 hours. |
| **Live Discovery Fallback** | **Zero-Wait Access.** If a table is missing from the cache, the gateway performs a targeted live check. Newly created tables are accessible instantly without waiting for a full refresh. |
| **Metadata Descriptions** | **Rich Context.** Table and column descriptions from BigQuery are exposed as OData annotations and surfaced in the Marketplace UI. |
| **Lossless Data Integrity** | **Complex Data, Simplified.** Automatically handles BigQuery `RECORD` and `REPEATED` types by casting them to JSON strings, ensuring nested data is readable in spreadsheets. |

---

## ⚡ Quick Start (30 Seconds)

Get the gateway running locally in three simple steps:

1.  **Clone and Install:**
    ```bash
    git clone https://github.com/your-repo/odata-gateway-bq.git
    cd odata-gateway-bq
    npm install
    ```

2.  **Configure Authentication (Local Dev):**
    For local development, use your personal identity via Application Default Credentials (ADC).
    ```bash
    gcloud auth application-default login
    ```

3.  **Configure Environment:**
    Set `ANONYMOUS_MODE=true` for a quick local test without OIDC setup.
    ```bash
    export BQ_BILLING_PROJECT_ID="your-project-id"
    export ANONYMOUS_MODE="true"
    ```

3.  **Launch:**
    ```bash
    npm run dev
    ```
    *Open `http://localhost:3000/v1/your-project/your-dataset/$metadata` to see your OData schema.*

---

## 🗺️ Documentation & Roadmap

*   **[Full Documentation Index](./docs/index.md)** - Deep dives into Architecture, Security, and API Contracts.
*   **[Deployment Guide](./docs/tasks.md)** - Step-by-step instructions for **Google Cloud Run**, **Kubernetes**, and **OpenShift**.
*   **[User Guide](./docs/getting-started.md)** - How to connect Excel and Power BI in minutes.

### Roadmap 🚀
- [x] **Phase 2:** Support for OData `$expand` via relationship manifests (BigQuery `ARRAY` sub-queries).
- [x] **Phase 2:** Support for OData `$apply` (BigQuery aggregation push-down).
- [x] **Phase 2:** Native BigQuery `$search` and `$compute` support.
- [ ] **Phase 3:** AI-Agent shims for Microsoft Copilot specialized connectors.

---

## 🙌 Support the Project

This project is built to make data access simple and secure. If this gateway helped you unlock your data lakehouse, please consider supporting us:

*   **⭐ Give us a Star:** It helps the project grow and reach more developers.
*   **🐛 Report Bugs:** Use the GitHub Issues to help us improve.
*   **💡 Share Feedback:** Tell us how you're using the gateway!

**Made with ❤️ for the Data Community.**
