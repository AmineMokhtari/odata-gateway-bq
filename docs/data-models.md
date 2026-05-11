# Data Models Documentation

This document explains the internal and external data structures used by the **odata-gateway-bq**, specifically focusing on tenant configuration and the mapping of BigQuery schemas to OData.

## Multi-Tenant Configuration (`TenantConfig`)
The system's behavior for each project/dataset combination is governed by the `tenants.yaml` configuration.

| Field | Type | Description |
| --- | --- | --- |
| `project_id` | `string` | The GCP Project ID where the dataset resides. |
| `dataset_id` | `string` | The BigQuery Dataset ID to expose. |
| `scan_budget_gb` | `number` | The maximum size (in GB) of a single query scan allowed. |
| `name` | `string` (Optional) | A human-readable display name for the tenant. |
| `access_rules` | `object` (Optional) | Authorization rules (Emails/Groups). |

## BigQuery-to-OData Type Mapping
The system dynamically generates the Entity Data Model (EDM) by mapping BigQuery types to standard OData Edm types.

| BigQuery Type | OData Edm Type | Implementation Detail |
| --- | --- | --- |
| `STRING` | `Edm.String` | Default string representation. |
| `INT64` | `Edm.Int64` | Standard 64-bit integer. |
| `FLOAT64` | `Edm.Double` | Double-precision floating point. |
| `BOOL` | `Edm.Boolean` | Boolean flag. |
| `TIMESTAMP` | `Edm.DateTimeOffset` | ISO 8601 representation. |
| `DATE` | `Edm.Date` | YYYY-MM-DD format. |
| `DATETIME` | `Edm.DateTimeOffset` | Mapped to DateTimeOffset for protocol compatibility. |
| `NUMERIC` / `BIGNUMERIC` | `Edm.Decimal` | High-precision decimal. |
| `RECORD` / `STRUCT` | `Edm.String` | **Casted:** Automatically wrapped in `TO_JSON_STRING()`. |

## Lossless JSON Casting
BigQuery `RECORD` (struct) and `REPEATED` (array) types are not natively supported by the base OData-to-SQL translator in a streaming-compatible way. To ensure 100% data fidelity, the gateway automatically injects `TO_JSON_STRING()` into the BigQuery SQL projection for these columns. This ensures that complex nested enterprise data is delivered as a JSON-encoded string within the OData payload.

