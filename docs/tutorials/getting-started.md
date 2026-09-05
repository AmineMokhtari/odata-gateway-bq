# Getting Started: Connecting to the Data Catalog

Welcome to the **OData Gateway for BigQuery**. This tutorial will walk you through the exact steps to connect your data tools (like Microsoft Excel or Power BI) to your organization's BigQuery datasets for the first time.

## Prerequisites

Before you begin, make sure you have:
- An active **Office 365 / Microsoft Entra ID** account (if your organization uses Entra ID).
- The URL for your organization's **Data Catalog Portal** (provided by your administrator).
- **Microsoft Excel** (2016 or later) or **Power BI Desktop** installed on your machine.

---

## Step 1: Open the Data Catalog

We recommend using the Data Catalog Portal to easily find and connect to datasets, rather than typing URLs manually.

1. Open your web browser and navigate to the Data Catalog URL provided by your administrator.
2. Browse or search the catalog for the BigQuery dataset you want to query.
3. Click on a dataset card to open the **Dataset Details** page.

---

## Step 2: Choose Your Connection Method

On the top-right side of the Dataset Details page, you will see an Action Bar with different ways to connect. Choose the one that matches your tool:

### Option A: Connect via Microsoft Excel (One-Click)
1. Click the **"Export Excel (.odc)"** button. A file will download to your computer.
2. Double-click the downloaded `.odc` file.
3. Microsoft Excel will launch automatically.
4. When prompted for credentials, select **Organizational Account**.
5. Click **Sign in** and log in with your work email and password.
6. Excel will establish a live connection and load the dataset into your workbook.

### Option B: Connect via Power BI (One-Click)
1. Click the **"Export Power BI (.pbids)"** button to download the connection file.
2. Double-click the downloaded `.pbids` file.
3. Power BI Desktop will open and prompt you to sign in.
4. Select **Organizational account** on the left side of the prompt.
5. Click **Sign in** and enter your credentials.
6. Once signed in, click **Connect**. The Power BI Navigator will appear, showing all tables in the dataset ready to load.

### Option C: Manual URL Connection
If you prefer not to use the downloaded files, you can copy the link directly:
1. Click the **"Copy URL"** button in the Data Catalog.
2. Open Excel (`Data > Get Data > From Other Sources > From OData Feed`) or Power BI (`Get Data > OData feed`).
3. Paste the URL into the prompt and click OK.
4. Select **Organizational Account**, sign in, and click Connect.

---

## Step 3: Verify Your Connection

1. Once connected, your tool (Excel or Power BI) will display a **Navigator** window.
2. You should see a list of tables and views from the BigQuery dataset.
3. Select a table and click **Load** (or **Transform Data** in Power BI) to confirm data is flowing.

Congratulations! You have successfully connected to the OData Gateway.

> [!TIP]
> If you encounter authentication issues, see our [Troubleshooting Guide](../guides/troubleshooting.md).
> To learn how to query large datasets efficiently, read our guide on [Optimizing Queries with Query Folding](../guides/query-folding.md).
