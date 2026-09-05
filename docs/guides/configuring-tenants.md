# How-To Guide: Configuring Tenants and Access Rules

This guide explains how to define and manage BigQuery dataset access through the Gateway's central policy engine, the `tenants.yaml` file.

## How to Define a New Tenant

A "tenant" in the Gateway corresponds to a specific BigQuery dataset. To expose a dataset via OData, you must declare it in your tenant configuration file.

1. Open your `config/tenants.yaml` file (or `dev-tenants.yaml` for local development).
2. Add a new block under the `tenants` list.
3. Define the `project_id`, `dataset_id`, and a mandatory `scan_budget_gb` limit.

**Example:**
```yaml
tenants:
  - project_id: "my-gcp-project"
    dataset_id: "marketing_data"
    scan_budget_gb: 10
    name: "Marketing Analytics"
```

## How to Restrict Access to a Tenant

By default, if you are running in a production environment with OIDC enabled, you should define `access_rules` to ensure only authorized users can query the dataset.

1. Locate your tenant block in the YAML file.
2. Add an `access_rules` section.
3. List the allowed user emails under `emails`, or allowed OIDC group names under `groups`.

**Example:**
```yaml
tenants:
  - project_id: "my-gcp-project"
    dataset_id: "marketing_data"
    scan_budget_gb: 10
    access_rules:
      emails:
        - "elena@example.com"
        - "john@example.com"
      groups:
        - "Analyst_Group"
```

## How to Apply Configuration Changes

Changes to the `tenants.yaml` file are not picked up automatically to ensure stability during active queries.

1. Save your changes to the `tenants.yaml` file.
2. If running locally, restart the development server.
3. If running in a multi-instance production environment, issue an HTTP POST request to the Admin API:
   ```bash
   curl -X POST https://your-gateway-url.com/admin/config/reload
   ```
   This signals all instances to safely hot-reload the new configuration.

> [!NOTE]
> For a full list of acceptable schema properties in the YAML file, see the [Configuration Reference](../reference/configuration-flags.md).
