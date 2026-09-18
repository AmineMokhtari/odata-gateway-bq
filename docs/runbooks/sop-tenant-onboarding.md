# SOP: Zero-Downtime Tenant Onboarding & Access Policy Updates

| Attribute | Value |
| :--- | :--- |
| **Runbook ID** | RB-06 |
| **Type** | Standard Operating Procedure (SOP) |
| **Component** | `tenants.yaml`, `obq-gateway` (`plugins/00-config-loader.ts`, `/v1/admin/config/reload`) |
| **Primary Audience** | Data Stewards, Cloud Administrators |

---

## 1. Overview & Purpose

This standard operating procedure guides the onboarding of new BigQuery datasets and configuration of tenant access policies without restarting the gateway or causing downtime for active data consumers.

---

## 2. Prerequisites

1. **Target Dataset Exists:** The BigQuery dataset must already exist in the target GCP project.
2. **IAM Permissions Configured:** The central gateway Service Account must have read access on the target dataset:
   ```bash
   gcloud projects add-iam-policy-binding <TARGET_PROJECT_ID> \
     --member="serviceAccount:<GATEWAY_SERVICE_ACCOUNT_EMAIL>" \
     --role="roles/bigquery.dataViewer"
   ```
3. **Admin Token:** An OIDC bearer token from an authorized administrator or administrative network access.

---

## 3. Step-by-Step Procedure

### Step 1: Edit the Tenant Configuration (`tenants.yaml`)
Locate `tenants.yaml` in your configuration repository or volume mount:

```yaml
tenants:
  # Existing tenants...

  # New Tenant Entry
  - project_id: "marketing-analytics-prod"
    dataset_id: "campaign_performance"
    scan_budget_gb: 25                          # Max bytes scanned per query
    name: "Marketing Campaign Performance Hub"   # Display name in Catalog UI
    access_rules:
      emails:
        - "cmo@company.com"
        - "growth-lead@company.com"
      groups:
        - "marketing-analysts-aad-group"
```

> [!TIP]
> If `access_rules` is omitted, the dataset is accessible to all authenticated users. Specifying `emails` or `groups` enforces strict zero-trust filtering.

### Step 2: Validate YAML Formatting
Before applying, ensure the YAML is syntactically valid:
```bash
python3 -c "import yaml; yaml.safe_load(open('tenants.yaml'))" && echo "YAML Valid"
```

### Step 3: Trigger Dynamic Hot-Reload via Admin API
Execute a `POST` request to the configuration reload endpoint:

```bash
curl -i -X POST \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  https://<gateway-domain>/v1/admin/config/reload
```

**Expected HTTP 200 Response:**
```json
{
  "status": "success",
  "message": "Tenant configuration reloaded",
  "tenantCount": 15
}
```

### Step 4: Verify the Service Document & Metadata
Query the newly exposed OData service root:
```bash
curl -i https://<gateway-domain>/v1/marketing-analytics-prod/campaign_performance \
  -H "Authorization: Bearer <USER_TOKEN>"
```

Verify that the EDM metadata XML can be parsed:
```bash
curl -i https://<gateway-domain>/v1/marketing-analytics-prod/campaign_performance/$metadata \
  -H "Authorization: Bearer <USER_TOKEN>"
```

### Step 5: Verify in Data Catalog UI
1. Log into the Catalog UI (`https://<gateway-domain>/catalog` or `http://localhost:3000`).
2. Search for the newly onboarded dataset.
3. Confirm tables, descriptions, and Primary/Foreign Key badges are rendered.

---

## 4. Rollback Procedure
If configuration reload fails or syntax was corrupted:
1. Revert `tenants.yaml` to the prior git commit.
2. Re-trigger `POST https://<gateway-domain>/v1/admin/config/reload`.
3. Confirm `status: "success"` and expected `tenantCount`.
