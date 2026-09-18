# Operational Runbooks & Incident Response Index

Welcome to the operational runbooks and Standard Operating Procedures (SOPs) for the **OData Gateway for BigQuery** (`odata-gateway-bq`).

These runbooks provide prescriptive, actionable guides for site reliability engineers (SREs), cloud administrators, and on-call engineers responsible for maintaining the availability, performance, and financial governance of the gateway.

---

## 1. Incident Severity Matrix

| Severity | Definition | Response Target | Applicable Runbooks |
| :--- | :--- | :--- | :--- |
| **P1 - Critical** | Gateway down, mass authentication outage, or container crash-looping impacting all users. | **< 15 minutes** | [RB-02: Entra ID Auth Failure](./incident-entra-auth-failure.md)<br>[RB-03: Cloud Run OOM Restarts](./incident-cloud-run-oom.md)<br>[RB-10: Billing Project Failover](./dr-billing-project-failover.md)<br>[RB-11: IdP Emergency Fallback](./dr-idp-outage-emergency-fallback.md) |
| **P2 - High** | Significant degradation, dry-run circuit breaker storm, or persistent audit logging failures. | **< 1 hour** | [RB-01: Scan Budget Circuit Breaker](./incident-budget-exceeded.md)<br>[RB-04: Storage Write Stream Drop](./incident-audit-stream-drop.md)<br>[RB-05: BigQuery Quota Starvation](./incident-bigquery-quota-exceeded.md) |
| **P3 - Medium** | Single tenant schema drift, stale metadata cache, or non-blocking client errors. | **< 4 hours** | [RB-06: Tenant Onboarding & Budget](./sop-tenant-onboarding.md)<br>[RB-07: Schema Cache Refresh](./sop-schema-cache-refresh.md) |
| **P4 - Low** | Routine maintenance, credential rotation, scheduled canary releases. | **Scheduled** | [RB-08: Credential Rotation](./sop-credential-rotation.md)<br>[RB-09: Release & Rollback](./sop-release-and-rollback.md) |

---

## 2. Runbook Catalog

### Incident Response Runbooks (Active Outages)
* **[RB-01: BigQuery Scan Budget Circuit Breaker Trip (`BudgetExceeded`)](./incident-budget-exceeded.md)**  
  Triage query dry-run rejections, isolate heavy un-folded queries, and adjust tenant scan budgets without downtime.
* **[RB-02: Entra ID / OIDC Token Rejection & BI Auth Outage (`AADSTS500011`)](./incident-entra-auth-failure.md)**  
  Diagnose JWT verification failures, resolve Application ID URI mismatches, and clear Power BI / Excel cached credentials.
* **[RB-03: Cloud Run Memory Exhaustion & Container OOM Kills (Exit 137)](./incident-cloud-run-oom.md)**  
  Troubleshoot high memory usage, tune `DEFAULT_FETCH_SIZE`, and handle unpaginated streaming load.
* **[RB-04: Storage Write API Audit Logging Backpressure & Stream Drop](./incident-audit-stream-drop.md)**  
  Recover broken Protobuf audit logging streams to BigQuery `obq_audit_logs.api_audit`.
* **[RB-05: BigQuery Slot Quota Starvation & Concurrency Throttling](./incident-bigquery-quota-exceeded.md)**  
  Mitigate BigQuery rate limits (403/429), inspect running jobs via `INFORMATION_SCHEMA`, and balance tenant workloads.

### Standard Operating Procedures (SOPs / Day-2 Operations)
* **[RB-06: Zero-Downtime Tenant Onboarding & Budget Adjustments](./sop-tenant-onboarding.md)**  
  Add new BigQuery datasets, configure access rules, and hot-reload `tenants.yaml` via `/v1/admin/config/reload`.
* **[RB-07: Schema Evolution & Metadata Cache Invalidation](./sop-schema-cache-refresh.md)**  
  Force cache flushes via `/v1/admin/refresh/:projectId/:datasetId` or `/v1/admin/refresh-all` after BigQuery schema updates.
* **[RB-08: GCP Service Account Key & Workload Identity Rotation](./sop-credential-rotation.md)**  
  Safely rotate service account credentials and verify IAM permissions without downtime.
* **[RB-09: Safe Release Deployment & Instant Rollback (Cloud Run)](./sop-release-and-rollback.md)**  
  Execute zero-downtime blue/green deployments using Cloud Build and implement instant rollbacks.

### Disaster Recovery & Emergency Operations
* **[RB-10: Billing Project Switchover & Multi-Region Failover](./dr-billing-project-failover.md)**  
  Emergency switch of `BQ_BILLING_PROJECT_ID` during quota suspension or regional GCP degradation.
* **[RB-11: Identity Provider Outage Emergency Fallback](./dr-idp-outage-emergency-fallback.md)**  
  Activate perimeter-secured anonymous mode or Cloud IAP header offloading during global Entra ID outages.

---

## 3. Quick Triage & Diagnostic Cheat-Sheet

### 1. Gateway Health & Diagnostics
```bash
# Public health check
curl -i https://<gateway-domain>/health

# Check active tenant count and reload configuration
curl -i -X POST \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  https://<gateway-domain>/v1/admin/config/reload

# Invalidate metadata cache for a specific dataset
curl -i -X POST \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  https://<gateway-domain>/v1/admin/refresh/<PROJECT_ID>/<DATASET_ID>
```

### 2. Tracing by Correlation ID
Every HTTP request generates or echoes an `x-correlation-id` header. Search Cloud Logging:
```bash
gcloud logging read 'resource.type="cloud_run_revision" AND jsonPayload.correlation_id="<CORRELATION_ID>"' \
  --project="<BILLING_PROJECT_ID>" \
  --limit=20 \
  --format="json"
```

### 3. Check Recent Query Audit in BigQuery
```sql
SELECT
  timestamp,
  userEmail,
  action,
  bytesProcessed,
  status,
  correlationId
FROM `<BILLING_PROJECT_ID>.obq_audit_logs.api_audit`
WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)
ORDER BY timestamp DESC
LIMIT 50;
```
