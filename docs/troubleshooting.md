# Troubleshooting & FAQ

Common questions and solutions for the OData BigQuery Gateway.

## Troubleshooting Common Errors

### 1. Error: "Access Denied" or "Unauthorized"
- **Cause:** Your identity was verified, but you do not have permission to access this specific dataset in the Gateway's internal rules.
- **Solution:** Contact your Data Administrator to request access to the specific Project and Dataset ID.

### 2. Error: "Budget Exceeded" (OData Error: `BudgetExceeded`)
- **Cause:** The query you are trying to run would scan more data than your allowed limit (e.g., > 10GB).
- **Solution:** 
  - Add filters to your query (e.g., filter by `Date`, `Region`, or `ID`).
  - Select only the columns you need rather than the whole table.
  - If you genuinely need the full dataset, contact an administrator to request a temporary budget increase.

### 3. Error: "Table Not Found"
- **Cause:** The Gateway has not yet discovered the table, or it was recently deleted/renamed in BigQuery.
- **Solution:** 
  - Wait for the daily 24h refresh.
  - Ask an admin to trigger an "Admin Metadata Refresh" if the table was just created.

### 4. Excel/Power BI: "Unable to connect using Organizational Account"
- **Cause:** Your tool may be using a cached, expired token.
- **Solution:** In Excel/Power BI, go to **Data Source Settings**, find the Gateway URL, and select **Clear Permissions**. Then try connecting again.

---

## Frequently Asked Questions (FAQ)

### Can I write or delete data?
**No.** The Gateway is strictly read-only. It is designed for analysis and reporting, not for database management.

### How fresh is the data?
The Gateway queries BigQuery **in real-time**. While the full metadata list is refreshed every 24 hours, the Gateway has a **Live Discovery** feature that can find and register new tables instantly as soon as you try to access them.

### Why do some columns look like text but contain brackets `{}`?
These are "Nested" fields from BigQuery. Because Excel doesn't support nested structures in a single cell, the Gateway converts them to **JSON strings**. You can use Excel's "Power Query" or Power BI's "JSON" transformation to expand these if needed.

### Is my password stored?
**No.** The Gateway uses OIDC (OpenID Connect). You authenticate directly with your organization (e.g., Microsoft). The Gateway only receives a temporary "Token" that proves who you are.

### What is the maximum data I can pull?
While there is no hard limit on the *number of rows*, there is a limit on the **amount of data scanned** (the "Budget"). Additionally, Excel has its own row limit (approx. 1 million rows). Power BI is better suited for larger volumes.
