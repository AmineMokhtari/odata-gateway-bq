# Knowledge Base: How the Gateway Works

The **OData Gateway for BigQuery** acts as a secure bridge between your professional analytics tools and your organization's BigQuery data lakehouse.

## Core Concepts

### 1. The "Trusted Subsystem" Security
Instead of requiring every user to have direct access to Google Cloud, the Gateway uses a **Trusted Subsystem** model. 
- You sign in with your familiar **work account (O365/Entra ID)**.
- The Gateway verifies your identity and checks against **internal access rules** to see what data you are allowed to view.
- If authorized, the Gateway fetches the data on your behalf using a secure, service-level account.
- **Why?** This ensures rapid access without waiting for complex IT permission changes in the cloud.

### 2. Automatic Data Discovery
The Gateway automatically "scans" the BigQuery datasets you are authorized to see and creates an **OData Metadata ($metadata)** map. This map tells tools like Excel exactly what columns, types, and tables are available. 
- **Refresh Rate:** Metadata is refreshed every 24 hours.
- **Live Discovery:** If you request a new table that was just created, the Gateway will automatically perform a "live check" against BigQuery. If the table exists, it will be added to your available data immediately without waiting for the 24-hour refresh.

### 3. Data Type Mapping
BigQuery and Excel talk different "languages." The Gateway translates them automatically:
- **Numbers/Dates:** Handled natively.
- **Nested Data (Records/JSON):** BigQuery "Nested" or "Repeated" fields are automatically converted into **JSON Strings** so they can be viewed inside a single Excel cell.

### 4. Financial Safety (The Dry-Run)
To prevent accidental costs from querying massive datasets, the Gateway performs a **"Dry-Run"** before it sends any query to BigQuery.
- It calculates exactly how much data will be scanned.
- If the estimate exceeds your department's **Scan Budget** (default is often 10GB), the query is blocked to save costs.

---

## Data Privacy & Compliance
- **Read-Only:** The Gateway is strictly read-only. You cannot delete or modify data in BigQuery through this interface.
- **Auditing:** Every query you run is logged with your identity. This is injected into the BigQuery logs as a "Correlation ID," ensuring full transparency and compliance.
- **Streaming:** Data is streamed directly to your tool. The Gateway does not "save" or "store" your data locally, ensuring it stays within the secure cloud environment.
