# How-To Guide: Troubleshooting Connection and Query Errors

This guide provides practical steps to resolve common errors you might encounter when connecting to the OData Gateway or executing queries.

## How to Fix Authentication Errors (AADSTS500011 / "Unable to connect")

If you encounter authentication failures or your tool reports it cannot connect using an Organizational Account, it is usually because your BI tool is using an expired or incorrectly scoped cached token.

1. **Clear Permissions in Power BI:**
   - Go to **File > Options and settings > Data source settings**.
   - Locate the Gateway URL and select **Clear Permissions**.

2. **Clear Permissions in Excel:**
   - Go to **Data > Get Data > Data Source Settings**.
   - Locate the Gateway URL and select **Clear Permissions**.

3. **Verify Connection Details:**
   - Ensure you are selecting **Organizational account** during the login prompt. "Basic" or "Anonymous" will fail.
   - Verify that the URL exactly matches what the Data Catalog provided.

4. **Retry the Connection:**
   - Re-initiate the connection process and log in again when prompted.

## How to Resolve "Budget Exceeded" Errors

If your query fails with a `BudgetExceeded` error, it means the query you attempted would scan more data than your allowed limit. The Gateway blocks this *before* execution to prevent cost spikes.

1. **Open the Data Catalog:** Navigate to the Catalog UI for the dataset you were querying.
2. **Review Elena's Advice:** The UI will automatically display a slide-out drawer with specific recommendations for your failed query.
3. **Apply Quick Fixes:** Click the suggested fixes (e.g., "Filter by Last 7 Days") provided in the drawer.
4. **Use Query Folding:** If connecting from Excel or Power BI, do not load the whole table. Click **Transform Data** in the Navigator window, apply column filters visually, and then load the data. (See the [Query Folding Guide](./query-folding.md) for details).

## How to Fix "Access Denied" or "Unauthorized"

1. Verify that you are logged into the correct organizational account.
2. Ensure you are targeting the correct OData endpoint for your assigned Tenant ID.
3. Contact your Data Administrator and request that your email identity be added to the `access_rules` for the specific dataset in the Gateway's configuration.

## How to Resolve "Table Not Found"

If you know a table exists in BigQuery but the Gateway returns a "Table Not Found" error:
1. Try accessing the table directly by appending its name to the URL (e.g., `/v1/tenant/Project/Dataset/TableName`). The Gateway's Live Discovery feature will attempt to locate and register it instantly.
2. If it still fails, ask an administrator to trigger an **Admin Metadata Refresh** via the `/admin/refresh-all` endpoint.
