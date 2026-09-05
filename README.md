# [OData Gateway for BigQuery](https://github.com/AmineMokhtari/odata-gateway-bq)

By [Amine Mokhtari](https://github.com/AmineMokhtari)

### Unlock Your BigQuery Lakehouse for the Modern Enterprise

[![Fastify](https://img.shields.io/badge/fastify-v5.0.0-black.svg?style=flat-square&logo=fastify)](https://www.fastify.io)
[![TypeScript](https://img.shields.io/badge/typescript-v5.9-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg?style=flat-square)](https://opensource.org/licenses/Apache-2.0)

---

## What is it?

The **OData Gateway for BigQuery** is a production-grade, zero-trust data bridge that transforms your BigQuery datasets into a governed **Data Catalog**. It allows business users to access petabyte-scale data directly from tools like **Microsoft Excel**, **Power BI**, and **Microsoft Copilot** using the standard OData V4 protocol.

### Who is it for?

* **Data Engineers:** Who want to stop writing manual SQL exports and "SQL Tax" requests.
* **Data Consumers:** (Analysts, Finance, Marketing) who need real-time data in their familiar spreadsheet environments.
* **Architects:** Who need a secure, multi-tenant, and cost-controlled way to democratize data without exposing BigQuery IAM.
* **Chief Data Officers (CDO):** Who need to maximize the ROI of their BigQuery investment by safely democratizing data access while maintaining strict governance and cost control.

---

## Why It Matters (Features & Benefits)

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

## Table of Contents
* [What is it?](#what-is-it)
* [Why It Matters (Features & Benefits)](#why-it-matters-features--benefits)
* [Quick Start](#quick-start-30-seconds)
* [Publishing Docker Images](#publishing-docker-images-to-gcp-artifact-registry-via-cloud-build)
* [Documentation](#documentation)
* [Contributing](#contributing)
* [Getting Help & Support](#getting-help--support)
* [Important](#important)
* [License](#license)

---

## Quick Start (30 Seconds)

### Prerequisites

Before getting started, make sure you have:

* **Node.js**: v18.0.0 or later (v20+ LTS recommended) and `npm`
* **[Google Cloud SDK (gcloud CLI)](https://cloud.google.com/sdk/docs/install)** installed and authenticated
* **Google Cloud Project**: with BigQuery API enabled and active billing

Get the gateway running locally in simple steps:

1. **Clone and Install:**

    ```bash
    git clone https://github.com/AmineMokhtari/odata-gateway-bq.git
    cd odata-gateway-bq
    npm install
    ```

2. **Configure Authentication (Local Dev):**
    For local development, use your personal identity via Application Default Credentials (ADC).

    ```bash
    gcloud auth application-default login
    ```

3. **Configure Environment:**
    Set `ANONYMOUS_MODE=true` for a quick local test without OIDC setup.

    ```bash
    export BQ_BILLING_PROJECT_ID="your-project-id"
    export ANONYMOUS_MODE="true"
    ```

4. **Launch:**

    ```bash
    npm run dev
    ```

    * **Catalog UI:** `http://localhost:3000`
    * **OData API:** `http://localhost:3001/v1/your-project/your-dataset/$metadata`

> [!TIP]
> The compiled build generates artifacts in `obq-gateway/dist/obq-gateway/src/`. This path is automatically handled by `npm run dev`.

---

## Publishing Docker Images to GCP Artifact Registry (via Cloud Build)

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

## Documentation

For comprehensive guides, architecture deep dives, and operational manuals:

* **[Full Documentation Index](./docs/index.md)** – Complete reference for architecture, APIs, and operations.
* **[Getting Started Guide](./docs/getting-started.md)** – Step-by-step user guide for connecting Microsoft Excel and Power BI.
* **[System Architecture](./docs/architecture.md)** – Detailed design of the Audit-Execute pipeline, security model, and BigQuery streaming.
* **[API Contracts](./docs/api-contracts.md)** – Specification of OData v4 endpoints, governance routes, and admin controls.
* **[Deployment Guide](./docs/deployment-guide.md)** – Production deployment instructions for Google Cloud Run, Docker, and CI/CD.
* **[Troubleshooting & FAQ](./docs/troubleshooting.md)** – Common error resolutions, Elena Tips, and operational advice.

---

## Contributing

We welcome contributions from the community!

* Please read our **[Contributing Guide](./CONTRIBUTING.md)** for details on the Contributor License Agreement (CLA), coding standards, and our pull request process.
* Please review our **[Code of Conduct](./docs/code-of-conduct.md)** to ensure an inclusive and respectful environment for everyone.

---

## Getting Help & Support

* **Bug Reports & Feature Requests:** Please search existing issues or open a new one via **[GitHub Issues](https://github.com/AmineMokhtari/odata-gateway-bq/issues)**.
* **Feedback & Discussions:** Share how you are using the gateway or discuss ideas in **[GitHub Discussions](https://github.com/AmineMokhtari/odata-gateway-bq/discussions)** (or Issues).
* **Star the Project:** If this gateway helps you unlock your BigQuery data lakehouse, please consider starring the repository on GitHub!

---

## Important

**This is not an officially supported Google product. This project is not eligible for the [Google Open Source Software Vulnerability Rewards Program](https://bughunters.google.com/open-source-security).**

---

## License

This project is licensed under the **Apache License, Version 2.0**. You are free to use, modify, and distribute this software under its terms. See the **[LICENSE](./LICENSE)** file for the full license text.
