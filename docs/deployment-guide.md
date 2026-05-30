# Deployment Guide

This document provides architectural guidance and instructions for deploying the **odata-gateway-bq** to production environments.

## Primary Deployment Strategy: Google Cloud Run
The system is natively optimized for **Google Cloud Run (Serverless Containers)**.

### Infrastructure Requirements
- **Runtime:** Node.js 20+ (Containerized).
- **Service Account:** Requires a GCP Service Account with the following roles:
  - `roles/bigquery.dataViewer` (on the target datasets).
  - `roles/bigquery.jobUser` (in the execution project).
- **Networking:** Regional deployment recommended (matching BigQuery dataset residency).

### Configuration Environment Variables
| Variable | Description |
| --- | --- |
| `BQ_BILLING_PROJECT_ID` | (Required) Centralized project for job execution and billing. |
| `OIDC_ISSUER` | Your Entra ID / Okta OIDC discovery URL. |
| `OIDC_AUDIENCE` | The registered application audience for JWT verification. |
| `TENANTS_CONFIG_PATH` | (Optional) Path to `tenants.yaml` if on a shared mount. |
| `ANONYMOUS_MODE` | Set to `true` **ONLY** if behind a managed proxy like Cloud IAP. |
| `ENABLE_QUERY_BUILDER` | (Optional) Set to `true` to enable Visual Join/Aggregation UI. |

### CI/CD Pipeline
The project includes a GitHub Action for automated deployment:
- **Location:** `.github/workflows/deploy-cloud-run.yml`
- **Workflow:** Build Image → Push to Artifact Registry → Deploy to Cloud Run (Regional).

## Production Authentication Setup (Microsoft Entra ID)

If you are not using an Identity-Aware Proxy (IAP) and rely on the Gateway's built-in OIDC verification, you must configure a production App Registration.

### 1. Custom Domain Requirement
Desktop clients like Power BI and Excel, combined with Entra ID, require a valid, trusted domain for resource identification. Do not use raw IP addresses or the default `*.run.app` Cloud Run URL as your primary identity endpoint if possible.
- Map a custom domain (e.g., `https://odata.yourcompany.com`) to your Cloud Run instance.

### 2. Azure AD App Registration (Production)
1. **Register App**: Create an app in Azure App Registrations (e.g., `odata-gateway-bq-prod`).
2. **Account Type**: Select **"Accounts in this organizational directory only (Single tenant)"**.
3. **Authentication**: 
   - Add a **Web** platform.
   - Set the Redirect URI to `https://odata.yourcompany.com/auth/callback`.
4. **Certificates & secrets**:
   - Generate a **New client secret** and store the value securely in Google Secret Manager.
   - Inject this secret into your Cloud Run environment variables.
5. **Expose an API (Crucial for Power BI)**:
   - Go to **Expose an API**.
   - Set the **Application ID URI** to your custom domain: `https://odata.yourcompany.com`. 
   - *Failure to set this will result in the `AADSTS500011` (invalid_resource) error when users attempt to connect via Power BI's Organizational account.*
   - Add a scope (e.g., `OData.Read`) to allow token generation.

### 3. Environment Variables (Production)
In your Cloud Run configuration, ensure the OIDC variables match your production App Registration exactly:
```env
OIDC_ISSUER="https://login.microsoftonline.com/{tenant_id}/v2.0"
OIDC_AUDIENCE="https://odata.yourcompany.com"
```

## Governance at Scale (Multi-Instance)
In large organizations with multiple running instances, tenant configurations can be managed centrally.

### Shared File System Workflow
1. Mount a shared volume (NFS/Filestore) containing the `tenants.yaml` file.
2. Set `TENANTS_CONFIG_PATH` to point to the shared mount.
3. Update the file once.
4. Call `POST /admin/config/reload` on all running instances to synchronize.

### Security Hardening
1. **VPC Service Controls:** Enclose the Gateway and BigQuery in a VPC-SC perimeter to prevent data exfiltration.
2. **Identity-Aware Proxy (IAP):** Deploy the Gateway behind Cloud IAP and use `ANONYMOUS_MODE=true` to offload authentication to Google's edge.
3. **Egress Control:** Restrict container egress to only allowed OIDC and BigQuery IP ranges.

