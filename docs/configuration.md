# Configuration Reference

This document provides a comprehensive list of all configuration options required to run the **OData BigQuery Gateway**.

## 1. Environment Variables

These variables control the core behavior and security of the application.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `BQ_BILLING_PROJECT_ID` | **Yes** | - | All BigQuery jobs will be submitted to this project (Billing Project). |
| `OIDC_ISSUER` | **Yes*** | - | The OIDC discovery URL (e.g., `https://login.microsoftonline.com/[ID]/v2.0/`). |
| `OIDC_AUDIENCE` | **Yes*** | - | The Client ID/Audience registered in your Identity Provider (e.g., Entra ID). |
| `ANONYMOUS_MODE` | No | `false` | If `true`, authentication is disabled. Use for local development or behind Cloud IAP. |
| `ENABLE_QUERY_BUILDER` | No | `false` | If `true`, enables the Visual Join and Aggregation builder in the Marketplace UI. |
| `ENABLE_COMPRESSION` | No | `false` | If `true`, enables Gzip/Brotli response compression (recommended for Excel/Power BI). |
| `TENANTS_CONFIG_PATH` | No | `config/tenants.yaml` | The filesystem path to your tenant configuration file. |
| `PORT` | No | `3000` | The port the Fastify server will listen on. |
| `LOG_LEVEL` | No | `info` | The verbosity of logs (`debug`, `info`, `warn`, `error`). |
| `GOOGLE_APPLICATION_CREDENTIALS` | No** | - | Path to a Service Account JSON key. |

*\* Required unless `ANONYMOUS_MODE=true`.*  
*\** Required for non-GCP environments. In local environments, the system will fall back to **Application Default Credentials (ADC)** if this variable is not set.

### Configuring Application Default Credentials (ADC)
For local development, we recommend using ADC instead of service account keys. Run the following command:
```bash
gcloud auth application-default login
```
This enables the BigQuery client to use your personal identity for local testing, ensuring your credentials are never committed to source control.

---

## 2. Tenant Configuration (`tenants.yaml`)

The `tenants.yaml` file is the central policy engine for the gateway. It maps OData URLs to BigQuery datasets and enforces security rules.

### File Schema
```yaml
tenants:
  - project_id: "my-gcp-project"      # The project where the dataset lives
    dataset_id: "marketing_data"     # The BigQuery dataset ID
    scan_budget_gb: 10               # Mandatory limit per query
    name: "Marketing Analytics"      # (Optional) Friendly name
    access_rules:                    # (Optional) Authorization policy
      emails:                        # List of allowed user emails
        - "elena@example.com"
      groups:                        # List of allowed OIDC groups/roles
        - "Analyst"
        - "Marketing"
```

---

## 3. Advanced Configuration

### OIDC Authentication (jose)
- The gateway automatically performs OIDC discovery using the `OIDC_ISSUER`.
- It expects a standard `Bearer` token in the `Authorization` header.
- For `ANONYMOUS_MODE`, the gateway can extract identity from common proxy headers like `x-forwarded-email`.

### BigQuery Client
- The gateway uses the official `@google-cloud/bigquery` SDK.
- Clients are cached per `projectId:location` to optimize connection pooling.
- **Location Sensing:** The gateway detects dataset regions dynamically to ensure compliance with data residency rules.
