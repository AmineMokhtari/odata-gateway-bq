# 🚀 OData Gateway for BigQuery

### Unlock Your BigQuery Lakehouse for the Modern Enterprise.

[![Fastify](https://img.shields.io/badge/fastify-v5.0.0-black.svg?style=flat-square&logo=fastify)](https://www.fastify.io)
[![TypeScript](https://img.shields.io/badge/typescript-v5.9-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg?style=flat-square)](https://opensource.org/licenses/Apache-2.0)

---

## 🌟 What is it?
The **OData Gateway for BigQuery** is a production-grade, zero-trust data bridge that transforms your BigQuery datasets into a governed **Data Catalog**. It allows business users to access petabyte-scale data directly from tools like **Microsoft Excel**, **Power BI**, and **Microsoft Copilot** using the standard OData V4 protocol.

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
| **Zero-Footprint Streaming** | **Infinite Scale.** Data is streamed directly from BigQuery to the client. The gateway utilizes resilient Server-Driven Paging to enforce strict memory boundaries (< 256MB) even when handling massive un-chunked requests. |
| **Auto-Discovery (EDM)** | **Frictionless Onboarding.** The gateway automatically crawls your BigQuery schema. New tables appear in Excel/Power BI navigators automatically within 24 hours. |
| **Live Discovery Fallback** | **Zero-Wait Access.** If a table is missing from the cache, the gateway performs a targeted live check. Newly created tables are accessible instantly without waiting for a full refresh. |
| **Metadata Descriptions** | **Rich Context.** Table and column descriptions from BigQuery are exposed as OData annotations and surfaced in the Catalog UI. |
| **Lossless Data Integrity** | **Complex Data, Simplified.** Automatically handles BigQuery `RECORD` and `REPEATED` types by casting them to JSON strings, ensuring nested data is readable in spreadsheets. |
| **Advanced 1:N Joins** | **Full Relationship Fidelity.** Automatically discover and expand To-Many relationships using BigQuery's native nested `ARRAY` structures. |
| **Identity-Job Isolation** | **Strict Security.** BigQuery jobs are strictly bound to the user's OIDC identity, ensuring multi-tenant isolation at the data execution level. |

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
    *   **Catalog UI:** `http://localhost:3000`
    *   **OData API:** `http://localhost:3001/v1/your-project/your-dataset/$metadata`

> [!TIP]
> The compiled build generates artifacts in `obq-gateway/dist/obq-gateway/src/`. This path is automatically handled by `npm run dev`.

---

## 🐳 Publishing Docker Images to GCP Artifact Registry (via Cloud Build)

You can build and publish the Docker images for both `obq-gateway` and `obq-hub` using the provided publish scripts. 

These scripts delegate the entire build process to **GCP Cloud Build**, meaning **you do not need a local Docker daemon installed**. The built images are pushed directly to your specified **GCP Artifact Registry** repository. The scripts automatically set up the correct build context to include shared dependencies from the `common` and `odata-v4-gcp` folders.

### Prerequisites
* Ensure you are authenticated with GCP (`gcloud auth login`) and the active account has permissions to submit Cloud Builds (e.g., Cloud Build Editor).
* The **Cloud Build API** (`cloudbuild.googleapis.com`) must be enabled on your GCP project.
* You must have a Docker repository created in **GCP Artifact Registry** in the target region.

### Publishing All Services
To build and publish both `obq-gateway` and `obq-hub` simultaneously, use the root publish scripts:

**Bash:**
```bash
chmod +x publish.sh
./publish.sh -p <PROJECT_ID> -r <REGION> -repo <REPOSITORY_NAME> -t <TAG>
```

**PowerShell:**
```powershell
.\publish.ps1 -p <PROJECT_ID> -r <REGION> -repo <REPOSITORY_NAME> -t <TAG>
```

### For `obq-gateway`
Navigate to the `obq-gateway` directory and run either the Bash or PowerShell script:

**Bash:**
```bash
cd obq-gateway
chmod +x publish.sh
./publish.sh -p <PROJECT_ID> -r <REGION> -repo <REPOSITORY_NAME> -i <IMAGE_NAME> -t <TAG>
# Example: ./publish.sh -p my-gcp-project -r us-central1 -repo my-docker-repo
```

**PowerShell:**
```powershell
cd obq-gateway
.\publish.ps1 -p <PROJECT_ID> -r <REGION> -repo <REPOSITORY_NAME> -i <IMAGE_NAME> -t <TAG>
```

### For `obq-hub`
Navigate to the `obq-hub` directory and run either the Bash or PowerShell script:

**Bash:**
```bash
cd obq-hub
chmod +x publish.sh
./publish.sh -p <PROJECT_ID> -r <REGION> -repo <REPOSITORY_NAME> -i <IMAGE_NAME> -t <TAG>
```

**PowerShell:**
```powershell
cd obq-hub
.\publish.ps1 -p <PROJECT_ID> -r <REGION> -repo <REPOSITORY_NAME> -i <IMAGE_NAME> -t <TAG>
```

---

## 🗺️ Documentation & Roadmap

*   **[Full Documentation Index](./docs/index.md)** - Deep dives into Architecture, Security, and API Contracts.
*   **[Deployment Guide](./docs/tasks.md)** - Step-by-step instructions for **Google Cloud Run**, **Kubernetes**, and **OpenShift**.
*   **[User Guide](./docs/getting-started.md)** - How to connect Excel and Power BI in minutes.


## 🙌 Support the Project

This project is built to make data access simple and secure. If this gateway helped you unlock your data lakehouse, please consider supporting us:

*   **⭐ Give us a Star:** It helps the project grow and reach more developers.
*   **🐛 Report Bugs:** Use the GitHub Issues to help us improve.
*   **💡 Share Feedback:** Tell us how you're using the gateway!

**Made with ❤️ for the Data Community.**

