# Getting Started Guide: Connecting to the Data Catalog

Welcome to the **OData Gateway for BigQuery**. This guide will help you connect your favorite data tools (Excel, Power BI, etc.) to your organization's BigQuery datasets in minutes.

## Prerequisites
- An active **Office 365 / Microsoft Entra ID** account (if your organization uses Entra ID).
- Access to your organization's **Data Catalog Portal**.
- **Microsoft Excel** (2016 or later) or **Power BI Desktop**.

---

## The Data Catalog Experience

Instead of manually typing OData URLs, we recommend using the **Data Catalog Portal**.

1. Navigate to the Data Catalog URL provided by your administrator.
2. Browse or search for available BigQuery datasets.
3. Click on a dataset to open the **Dataset Details** page.
4. **Usage Hub:** Check the top navigation bar to access your **Personal Usage Hub**, where you can monitor your monthly query usage and recent job history.

---

## One-Click Dataset Connections

On the top-right side of the **Dataset Details** page, you will find a premium Action Bar containing three connection helpers for the entire dataset:

### 1. Copy URL
- Click the **"Copy URL"** button. The OData service root endpoint URL of your dataset is instantly copied to your clipboard. You can paste this directly into Excel, Power BI, or any compatible BI tool.

### 2. Export Excel (.odc)
- Click the **"Export Excel (.odc)"** button to download a pre-configured Office Data Connection file for the dataset.
- Double-click/open the downloaded `.odc` file.
- Microsoft Excel will launch automatically and prompt you for credentials. Select **Organizational Account**, sign in, and Excel will establish a live connection to the entire dataset!

### 3. Export Power BI (.pbids)
- Click the **"Export Power BI (.pbids)"** button to download a Power BI Data Source Reference file.
- Double-click the downloaded `.pbids` file.
- Power BI Desktop will launch instantly and pre-configure the data connection. Sign in using your **Organizational account** when prompted, and all tables in the dataset will load in the Navigator!

---

## Visual Schema Badges (PK & FK)

When exploring table columns on the **Dataset Details** page:
- **Primary Keys (PK)**: Marked with a blue **PK** badge next to the column name. This represents the unique key used to index the table.
- **Foreign Keys (FK)**: Marked with a violet **FK** badge. Hover your cursor over the **FK** badge to view a tooltip stating the target constraint relationship (e.g. `References Customers(id)`), making schema joins highly discoverable.

---

## Manual Connection via Microsoft Excel

1. **Open Excel** and create a new workbook.
2. Go to the **Data** tab in the ribbon.
3. Select **Get Data** > **From Other Sources** > **From OData Feed**.
4. **Enter your URL:** Paste the OData Gateway URL copied from the Catalog details.
5. **Authentication:**
   - In the login window, select **Organizational Account**.
   - Click **Sign in**.
   - Use your standard work email and password.
6. **Select Data:** Once connected, a "Navigator" window will appear showing all available tables and views in your dataset.
7. **Load:** Select the table you want and click **Load**.

## Manual Connection via Power BI Desktop

1. **Open Power BI Desktop**.
2. Click **Get Data** in the Home ribbon and select **OData feed**.
3. **URL:** Enter your OData Gateway URL and click **OK**.
4. **Authentication:**
   - Select **Organizational account** on the left sidebar.
   - Click **Sign in** and complete the login process.
   - Click **Connect**.
5. **Navigator:** Select the tables you need and click **Load** or **Transform Data**.

---

## Row-Level Filtering & "Query Folding" (Highly Recommended)

When working with large BigQuery datasets, **do not load the entire table first and then filter it**. Doing so scans more data, increases query execution times, and can consume your personal query budget.

Instead, leverage **Query Folding**. Both Microsoft Excel and Power BI support this natively over OData feeds. This means any filter you apply visually inside your tool is automatically translated into an OData `$filter` parameter and sent back to the BigQuery engine to run as a native `WHERE` clause.

### Step-by-Step: Filtering your Data Visually
1. When connecting via Excel or Power BI, do not click **Load** immediately in the *Navigator* window. Instead, click **Transform Data**.
2. This opens the **Power Query Editor**.
3. Locate the column you want to filter (e.g., `Region`, `EventDate`, or `Status`).
4. Click the **drop-down arrow** in that column's header.
5. Apply your desired filter (e.g., select specific values, or use *Date Filters* to specify a date range).
6. Click **Close & Apply** in the top-left corner.
7. Only the filtered data will be scanned on BigQuery and loaded into your tool.

```mermaid
sequenceDiagram
    participant BI as Excel / Power BI
    participant GW as OData Gateway
    participant BQ as Google BigQuery

    Note over BI: User filters visually in Power Query:<br/>Region equals "West"
    BI->>GW: HTTP GET .../Sales?$select=Id,Region&$filter=Region eq 'West'
    Note over GW: Gateway parses OData query<br/>and translates it to SQL
    GW->>BQ: Run SQL: SELECT Id, Region FROM Sales WHERE Region = 'West'
    BQ-->>GW: Returns only the matching rows (scanned volume is minimized)
    GW-->>BI: Returns JSON OData feed response
    Note over BI: Renders the filtered<br/>rows in your sheet
```

---

## Tips for Success & Elena's Advice
- **Use Filters:** If you are working with large datasets, use the OData filter options or the "Transform Data" view in Power BI to limit the data you pull.
- **Stay Connected:** Your credentials are saved securely. You can refresh your data anytime by clicking **Refresh** in your tool.
- **Advanced Joins (1:N):** You can now build complex joins visually in the Data Catalog. If a table has related data (e.g., an Order having multiple Line Items), you can select these in the "Related Data" section to include them in your export.
- **Elena's Tips:** If you encounter an error (such as a 403 Budget Exceeded or 401 Unauthorized), the Catalog UI will automatically slide out the **Elena Drawer**. This provides you with plain-English explanations and actionable buttons to fix the issue (e.g., "Select fewer columns").
- **Budget Limits:** Keep an eye on your Personal Usage Hub. Every query is pre-estimated to protect your organization from cost spikes.

