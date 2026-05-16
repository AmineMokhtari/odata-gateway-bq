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
   cd frontend && npm install
   ```

> [!NOTE]
> If you encounter missing UI components in the frontend (e.g., checkbox, progress), ensure you have installed them via shadcn: `cd frontend && npx shadcn@latest add checkbox progress`.

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
> The backend compiled code resides in `backend/dist/backend/src/app.js`. This nested structure is due to the inclusion of shared libraries in the build.

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
2. **Configuration**: Mocks are located in `frontend/src/mocks/`.
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
This mode replicates a production-like environment using OIDC for authentication.

### A. Azure AD App Registration
1. **Register App**: Go to [Azure App Registrations](https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps).
2. **Create Dev App**: Name it `odata-gateway-bq-dev`.
3. **Account Type**: Select **"Accounts in this organizational directory only (Single tenant)"**.
4. **Platform**: Select **"Web"** and set the Redirect URI to `http://localhost:3000/api/auth/callback/azure-ad`.
5. **Permissions**: Add `User.Read` (Delegated).
6. **Note IDs**: Capture the **Client ID** and **Tenant ID**.

### B. Environment Configuration
Update your `.env` file with the OIDC details:
```env
# Mandatory for BQ Execution
BQ_BILLING_PROJECT_ID="your-gcp-project-id"

# Disable Anonymous Mode
ANONYMOUS_MODE=false

# OIDC Configuration (From Step 3A)
OIDC_ISSUER="https://login.microsoftonline.com/{tenant_id}/v2.0"
OIDC_AUDIENCE="your-client-id"
```

### C. Tenant Configuration
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

---

## 🏗️ Best Practices & Architecture
- **Trusted Subsystem**: The server runs with its own identity. User identity is propagated via BigQuery **Job Labels** (`user_identity`) for auditing.
- **Zero-Buffered Streams**: Data is streamed from BigQuery to the client using Node.js `Transform` streams.
- **Actionable Guidance**: The system uses the **Elena's Tips** engine to intercept technical errors and provide reactive, human-readable advice in the UI.
- **Schema Discovery**: Metadata is cached in-memory and refreshed via `POST /admin/refresh-all`.

For a deeper dive into the system design, see the [System Architecture](./architecture.md) guide.


