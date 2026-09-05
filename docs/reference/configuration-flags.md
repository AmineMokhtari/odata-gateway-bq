# Reference: Configuration Flags & Schema

This document lists all environment variables and configuration schemas required to run the **OData Gateway for BigQuery**.

## Environment Variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `BQ_BILLING_PROJECT_ID` | **Yes** | - | All BigQuery jobs will be submitted to this project (Billing Project). |
| `BQ_AUDIT_DATASET` | No | `obq_audit_logs` | The BigQuery dataset name where persistent audit logs are stored. |
| `BQ_AUDIT_TABLE` | No | `api_audit` | The BigQuery table name where persistent audit logs are stored. |
| `DEFAULT_FETCH_SIZE` | No | `10000` | The maximum number of rows to return per request. |
| `OIDC_ISSUER` | **Yes*** | - | The OIDC discovery URL (e.g., `https://login.microsoftonline.com/[ID]/v2.0/`). |
| `OIDC_AUDIENCE` | **Yes*** | - | The Client ID/Audience registered in your Identity Provider. |
| `ANONYMOUS_MODE` | No | `false` | If `true`, authentication is disabled. Use for local development or behind Cloud IAP. |
| `ENABLE_QUERY_BUILDER` | No | `false` | If `true`, enables the Visual Join and Aggregation builder in the Catalog UI. |
| `ENABLE_COMPRESSION` | No | `false` | If `true`, enables Gzip/Brotli response compression. |
| `TENANTS_CONFIG_PATH` | No | `config/tenants.yaml` | The filesystem path to your tenant configuration file. |
| `PORT` | No | `3000` | The port the Fastify server will listen on. |
| `LOG_LEVEL` | No | `info` | The verbosity of logs (`debug`, `info`, `warn`, `error`). |
| `NEXT_PUBLIC_API_MOCKING` | No | `false` | (Frontend) If `true`, enables MSW mocking in the browser. |
| `DEFAULT_ANONYMOUS_USER_NAME` | No | `ANONYMOUS` | The user name displayed in the UI when `ANONYMOUS_MODE=true`. |
| `GOOGLE_APPLICATION_CREDENTIALS` | No** | - | Path to a Service Account JSON key (for non-ADC environments). |

*\* Required unless `ANONYMOUS_MODE=true`.*  
*\** Required for non-GCP environments without Application Default Credentials (ADC).

## Tenant Configuration Schema (`tenants.yaml`)

The `tenants.yaml` file controls access mapping.

```yaml
tenants:
  - project_id: "string"           # (Required) The GCP project where the dataset lives
    dataset_id: "string"           # (Required) The BigQuery dataset ID
    scan_budget_gb: integer        # (Required) Mandatory limit per query
    name: "string"                 # (Optional) Friendly name
    access_rules:                  # (Optional) Authorization policy
      emails:                      # (Optional) List of allowed user emails
        - "string"
      groups:                      # (Optional) List of allowed OIDC groups/roles
        - "string"
```
