# SOP: GCP Service Account Key & Workload Identity Rotation

| Attribute | Value |
| :--- | :--- |
| **Runbook ID** | RB-08 |
| **Type** | Standard Operating Procedure (SOP) |
| **Component** | GCP IAM, Secret Manager, `GOOGLE_APPLICATION_CREDENTIALS` |
| **Primary Audience** | Security Engineers, Cloud SRE |

---

## 1. Overview & Purpose

The gateway acts as a **Trusted Subsystem**, using a central Service Account to authenticate against BigQuery and Google Cloud APIs. This procedure describes how to rotate Service Account credentials safely without interrupting active user traffic.

---

## 2. Service Account Role Matrix

The gateway service account requires the following minimum IAM roles:

| Project Scope | Role Name | Purpose |
| :--- | :--- | :--- |
| **Billing Project** (`BQ_BILLING_PROJECT_ID`) | `roles/bigquery.jobUser` | Submit interactive queries and dry-runs |
| **Source Data Projects** | `roles/bigquery.dataViewer` | Read tables and inspect `INFORMATION_SCHEMA` |
| **Audit Log Dataset** (`BQ_AUDIT_DATASET`) | `roles/bigquery.dataEditor` | Append logs via BigQuery Storage Write API |

---

## 3. Step-by-Step Procedure: Cloud Run (Workload Identity)

Cloud Run uses **attached service accounts** (IAM Service Account Credentials API) without persistent JSON keys. No static key rotation is necessary; instead, verify IAM bindings and tokens periodically.

### Step 1: Verify Active Service Account on Cloud Run
```bash
gcloud run services describe odata-gateway \
  --region="<REGION>" \
  --format="value(spec.template.spec.serviceAccountName)"
```

### Step 2: Validate IAM Role Bindings
Verify that all required roles remain bound to the service account:
```bash
gcloud projects get-iam-policy <BQ_BILLING_PROJECT_ID> \
  --flatten="bindings[].members" \
  --filter="bindings.members:<SERVICE_ACCOUNT_EMAIL>"
```

---

## 4. Step-by-Step Procedure: VM / Hybrid / On-Prem (JSON Keys)

For deployments on Kubernetes, OpenShift, or Virtual Machines relying on `GOOGLE_APPLICATION_CREDENTIALS`:

### Step 1: Create a Secondary Service Account Key
Generate a new key without deleting the old one:
```bash
gcloud iam service-accounts keys create ./new-gateway-key.json \
  --iam-account="<SERVICE_ACCOUNT_EMAIL>" \
  --project="<BQ_BILLING_PROJECT_ID>"
```

### Step 2: Test the New Key Locally / Staging
Validate that the key functions before pushing to production:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="./new-gateway-key.json"
gcloud auth activate-service-account --key-file="./new-gateway-key.json"
bq ls --project_id=<BQ_BILLING_PROJECT_ID>
```

### Step 3: Update Secret in Kubernetes or Secret Manager
If running in Kubernetes / OpenShift:
```bash
kubectl create secret generic bq-gateway-key \
  --from-file=key.json=./new-gateway-key.json \
  --dry-run=client -o yaml | kubectl apply -f -
```

If using GCP Secret Manager:
```bash
gcloud secrets versions add odata-gateway-sa-key \
  --data-file="./new-gateway-key.json" \
  --project="<BQ_BILLING_PROJECT_ID>"
```

### Step 4: Perform Rolling Restart of Gateway Instances
Restart pods or containers to pick up the new credential:
```bash
kubectl rollout restart deployment/odata-gateway
```

### Step 5: Verify Production Gateway Health & Query Stream
```bash
curl -i https://<gateway-domain>/health
curl -i -G "https://<gateway-domain>/v1/<PROJECT_ID>/<DATASET_ID>/<TABLE_NAME>?\$top=1" \
  -H "Authorization: Bearer <TEST_TOKEN>"
```

### Step 6: Delete the Retired Key
Once the new key is active and verified across all pods:
1. List keys to identify the old Key ID:
   ```bash
   gcloud iam service-accounts keys list \
     --iam-account="<SERVICE_ACCOUNT_EMAIL>"
   ```
2. Delete the old key:
   ```bash
   gcloud iam service-accounts keys delete <OLD_KEY_ID> \
     --iam-account="<SERVICE_ACCOUNT_EMAIL>" \
     --quiet
   ```
3. Securely delete the local `./new-gateway-key.json` file.
