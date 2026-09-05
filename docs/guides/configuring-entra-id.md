# How-To Guide: Configuring Entra ID Authentication

This guide explains how to configure the OData Gateway for local development using Microsoft Entra ID (OIDC) instead of Anonymous Mode. This replicates a production-like environment.

## Step 1: Configure Local Network

Power BI and Entra ID require a valid resource URI. You must add a local DNS mapping to your `hosts` file:

1. Open Notepad as Administrator (Windows) or use `sudo nano` (Mac/Linux).
2. Edit `C:\Windows\System32\drivers\etc\hosts` (Windows) or `/etc/hosts` (Mac/Linux).
3. Add the following line:
   ```text
   127.0.0.1 local.odatabq.com
   ```

## Step 2: Register the Azure AD App

1. Go to [Azure App Registrations](https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps) and create a new app named `odata-gateway-bq-dev`.
2. For **Account Type**, select **"Accounts in this organizational directory only (Single tenant)"**.
3. Under **Authentication**:
   - Add a **Web** platform and set the Redirect URI to `http://local.odatabq.com:3005/auth/callback`.
   - Add a **Mobile and desktop applications** platform (Power BI Desktop will handle its own redirect).
4. Under **Certificates & secrets**:
   - Create a **New client secret**.
   - Copy the secret **Value** immediately.
5. Under **Expose an API**:
   - Set the **Application ID URI** to `http://local.odatabq.com:3005`.
   - Add a scope (e.g., `OData.Read`) and ensure it is enabled for admins and users.
6. From the Overview page, copy the **Client ID** and **Tenant ID**.

## Step 3: Update Environment Configuration

Update your `.env` file with the local domain and OIDC details:

```env
# Mandatory for BQ Execution
BQ_BILLING_PROJECT_ID="your-gcp-project-id"

# Disable Anonymous Mode
ANONYMOUS_MODE=false

# OIDC Configuration (Replace {tenant_id} with your actual Tenant ID)
OIDC_ISSUER="https://login.microsoftonline.com/{tenant_id}/v2.0"
OIDC_AUDIENCE="http://local.odatabq.com:3005"

# Set the gateway host and port
HOST="local.odatabq.com"
PORT=3005
```

## Step 4: Configure Tenant Access Rules

In your `dev-tenants.yaml`, define `access_rules` to map user emails from Entra ID to specific datasets:

```yaml
tenants:
  - id: dev-tenant
    name: "Development Tenant"
    bigquery:
      projectId: "your-gcp-project-id"
      datasets: ["your_dataset"]
    access_rules:
      - identity: "user@yourdomain.com"
        datasets: ["*"]
```

## Step 5: Connect via Power BI

1. Ensure your backend is running (`npm run dev`) and accessible at `http://local.odatabq.com:3005`.
2. Open Power BI Desktop.
3. Click **Get Data > OData feed**.
4. Enter your local endpoint (e.g., `http://local.odatabq.com:3005/v1/dev-tenant/...`).
5. In the authentication prompt, select **Organizational account**.
6. Click **Sign in**, complete the Entra ID flow, and then click **Connect**.
