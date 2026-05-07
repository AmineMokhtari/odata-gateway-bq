# Getting Started Guide: Connecting to the Data Marketplace

Welcome to the **OData Gateway for BigQuery**. This guide will help you connect your favorite data tools (Excel, Power BI, etc.) to your organization's BigQuery datasets in minutes.

## Prerequisites
- An active **Office 365 / Microsoft Entra ID** account.
- Your organization's specific **OData Gateway URL** (e.g., `https://data-gateway.example.com/v1/my-project/my-dataset/`).
- **Microsoft Excel** (2016 or later) or **Power BI Desktop**.

---

## Connecting via Microsoft Excel

1. **Open Excel** and create a new workbook.
2. Go to the **Data** tab in the ribbon.
3. Select **Get Data** > **From Other Sources** > **From OData Feed**.
4. **Enter your URL:** Paste the OData Gateway URL provided by your administrator.
5. **Authentication:**
   - In the login window, select **Organizational Account**.
   - Click **Sign in**.
   - Use your standard work email and password.
6. **Select Data:** Once connected, a "Navigator" window will appear showing all available tables and views in your dataset.
7. **Load:** Select the table you want and click **Load**.

## Connecting via Power BI Desktop

1. **Open Power BI Desktop**.
2. Click **Get Data** in the Home ribbon and select **OData feed**.
3. **URL:** Enter your OData Gateway URL and click **OK**.
4. **Authentication:**
   - Select **Organizational account** on the left sidebar.
   - Click **Sign in** and complete the login process.
   - Click **Connect**.
5. **Navigator:** Select the tables you need and click **Load** or **Transform Data**.

---

## Tips for Success
- **Use Filters:** If you are working with large datasets, use the OData filter options or the "Transform Data" view in Power BI to limit the data you pull.
- **Stay Connected:** Your credentials are saved securely. You can refresh your data anytime by clicking **Refresh** in your tool.
- **Budget Limits:** Each request is scanned for cost. If your query is too large, you may receive a "Budget Exceeded" message (see [Troubleshooting](./troubleshooting.md)).
