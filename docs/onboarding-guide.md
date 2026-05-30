# Developer Onboarding Guide: odata-gateway-bq

Welcome to the **odata-gateway-bq** project! This guide is designed to get you from a fresh clone to a running, verified development environment in under 15 minutes.

---

## 1. Common Steps
These steps are required for both authentication modes.

### A. Prerequisites
Before you start, ensure you have the following installed and configured:
- **Node.js**: v20.x or later.
- **TypeScript**: v5.x.
- **Google Cloud CLI**: [Install gcloud SDK](https://cloud.google.com/sdk/docs/install).

### B. Google Cloud ADC (Cloud Access)
We use **Application Default Credentials (ADC)** to avoid handling sensitive JSON keys locally.
1. Run the login command:
   ```bash
   gcloud auth application-default login
   ```
2. The server will now use your local identity to access BigQuery.

### C. Local Installation
1. **Clone & Install**:
   ```bash
   git clone <repo-url>
   cd odata-gateway-bq
   npm install
   cd obq-hub && npm install
   ```

> [!NOTE]
> If you encounter missing UI components in the frontend (e.g., checkbox, progress), ensure you have installed them via shadcn: `cd obq-hub && npx shadcn@latest add checkbox progress`.

2. **Prepare Configuration Files**:
   ```bash
   cp .env.example .env
   cp dev-tenants.yaml.example dev-tenants.yaml
   ```

### D. Development Workflow
Start both backend and frontend simultaneously with hot-reloading:
```bash
npm run dev
```
- **Backend API**: `http://127.0.0.1:3002` (Note: We use 127.0.0.1 and port 3002 to avoid IPv6 loopback issues).
- **Frontend / Catalog UI**: `http://localhost:3000`

> [!TIP]
> The compiled code resides in `obq-gateway/dist/obq-gateway/src/app.js`. This nested structure is due to the inclusion of shared libraries in the build.

### E. Testing & Verification
- **Standard Testing**: Runs the full suite using mocks:
  ```bash
  npm test
  ```
- **Live Integration Mode**: Verify real Azure/GCP configuration:
  ```bash
  export LIVE_TEST=true
  npm test
  ```

### F. Mocking with MSW (Optional)
The frontend includes **Mock Service Worker (MSW)** for testing or offline development.
1. **Enable Mocking**: Set `NEXT_PUBLIC_API_MOCKING=true` in your `.env` file.
2. **Configuration**: Mocks are located in `obq-hub/src/mocks/`.
3. **Note**: By default, MSW is disabled to allow direct communication with your local backend.

### G. Code Structure Conventions
- **src/plugins/**: Shared services (Auth, BQ Client, Caching).
- **src/routes/v1/**: API endpoint definitions.
- **src/services/**: Direct cloud SDK interactions and complex domain logic.
- **odata-v4-gcp/**: The hand-written OData translation engine (Lexer, Parser, Translator).
- **common/**: Shared TypeScript types between Frontend and Backend.

---

## 2. Anonymous Mode (Quick Start)
Use this mode for local development or testing without needing an identity provider like Azure AD.

### A. Environment Configuration
Update your `.env` file with these specific settings:
```env
# Mandatory for BQ Execution
BQ_BILLING_PROJECT_ID="your-gcp-project-id"

# Enable Anonymous Mode
ANONYMOUS_MODE=true
DEFAULT_ANONYMOUS_USER_NAME="Amine MOKHTARI"

# Disable OIDC requirements for quick start
OIDC_ISSUER=""
OIDC_AUDIENCE=""
```

### B. Tenant Configuration
In your `dev-tenants.yaml`, you can omit the `access_rules` section to allow unrestricted access to your development datasets:
```yaml
tenants:
  - id: dev-tenant
    name: "Development Tenant"
    bigquery:
      projectId: "your-gcp-project-id"
      datasets: ["your_dataset"]
    # No access_rules required in Anonymous Mode
```

---

## 3. Non-Anonymous Mode (Microsoft Entra ID)
This mode replicates a production-like environment using OIDC for authentication. To support Power BI and Excel desktop clients effectively, we use a local domain name instead of `localhost` or `127.0.0.1`.

### A. Local Network Configuration
Power BI and Entra ID require a valid resource URI. Add a local DNS mapping to your `hosts` file:
1. Open Notepad as Administrator.
2. Edit `C:\Windows\System32\drivers\etc\hosts` (Windows) or `/etc/hosts` (Mac/Linux).
3. Add the following line:
   ```text
   127.0.0.1 local.odatabq.com
   ```

### B. Azure AD App Registration
1. **Register App**: Go to [Azure App Registrations](https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps) and create a new app named `odata-gateway-bq-dev`.
2. **Account Type**: Select **"Accounts in this organizational directory only (Single tenant)"**.
3. **Authentication**: 
   - Add a **Web** platform and set the Redirect URI to `http://local.odatabq.com:3005/auth/callback`.
   - Add a **Mobile and desktop applications** platform with custom redirect URIs if needed for testing, though Power BI Desktop will handle its own redirect.
4. **Certificates & secrets**:
   - Go to "Certificates & secrets" and create a **New client secret**.
   - Copy the secret `Value` immediately (you will need it for the backend).
5. **Expose an API**:
   - Go to "Expose an API".
   - Set the **Application ID URI** to `http://local.odatabq.com:3005`. (This fixes the `AADSTS500011` invalid resource error).
   - Add a scope (e.g., `OData.Read`) and ensure it is enabled for admins and users.
   - (Optional) If "Add a client application" is disabled, ensure you have set the Application ID URI first. Then, you can add Power BI's client IDs if you want to pre-authorize them, but typical interactive logins won't require this.
6. **Note IDs**: Capture the **Client ID** and **Tenant ID** from the Overview page.

### C. Environment Configuration
Update your `.env` file with the local domain and OIDC details:
```env
# Mandatory for BQ Execution
BQ_BILLING_PROJECT_ID="your-gcp-project-id"

# Disable Anonymous Mode
ANONYMOUS_MODE=false

# OIDC Configuration (From Step 3B)
OIDC_ISSUER="https://login.microsoftonline.com/{tenant_id}/v2.0"
OIDC_AUDIENCE="http://local.odatabq.com:3005"
# Note: In development, token validation might fail if the issuer in the token 
# is from v1.0 but configured as v2.0. Ensure they match your App Registration setup.

# Set the gateway host and port
HOST="local.odatabq.com"
PORT=3005
```

### D. Tenant Configuration
In your `dev-tenants.yaml`, define `access_rules` to map user emails (from Entra ID) to datasets:
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

### E. Power BI Configuration
To connect Power BI Desktop to your local gateway:
1. Ensure your backend is running (`npm run dev`) and accessible at `http://local.odatabq.com:3005`.
2. Open Power BI Desktop. If you previously failed an authentication attempt, clear it:
   - Go to **File > Options and settings > Data source settings**.
   - Find any entries for `127.0.0.1` or `local.odatabq.com` and select **Clear Permissions**.
3. Click **Get Data > OData feed**.
4. Enter your local endpoint (e.g., `http://local.odatabq.com:3005/v1/dev-tenant/...`).
5. In the authentication prompt, select **Organizational account**.
6. Click **Sign in**, complete the Entra ID flow, and then click **Connect**.

---

## 🏗️ Best Practices & Architecture
- **Trusted Subsystem**: The server runs with its own identity. User identity is propagated via BigQuery **Job Labels** (`user_identity`) for auditing.
- **Zero-Buffered Streams**: Data is streamed from BigQuery to the client using Node.js `Transform` streams.
- **Actionable Guidance**: The system uses the **Elena's Tips** engine to intercept technical errors and provide reactive, human-readable advice in the UI.
- **Schema Discovery**: Metadata is cached in-memory and refreshed via `POST /admin/refresh-all`.

For a deeper dive into the system design, see the [System Architecture](./architecture.md) guide.


