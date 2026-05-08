# Developer Onboarding Guide: odata-gateway-bq

Welcome to the **odata-gateway-bq** project! This guide is designed to get you from a fresh clone to a running, verified development environment in under 15 minutes.

---

## 1. Prerequisites

Before you start, ensure you have the following installed and configured:
- **Node.js**: v20.x or later.
- **TypeScript**: v5.x.
- **Google Cloud CLI**: [Install gcloud SDK](https://cloud.google.com/sdk/docs/install).
- **Azure AD Access**: Permissions to create App Registrations in your Azure Tenant.

---

## 2. Environment Setup (Identity & Cloud)

### A. Azure AD App Registration (Identity)
The server uses OIDC for authentication. You must maintain separate registrations for Dev and Prod.
1. **Register App**: Go to [Azure App Registrations](https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps).
2. **Create Dev App**: Name it `odata-gateway-bq-dev`.
3. **Account Type**: Select **"Accounts in this organizational directory only (Single tenant)"**.
4. **Platform**: Select **"Web"** and set the Redirect URI to `http://localhost:3000/api/auth/callback/azure-ad` (or your local dev URL).
5. **Permissions**: Add `User.Read` (Delegated).
6. **Note IDs**: Capture the **Client ID** and **Tenant ID**.

### B. Google Cloud ADC (Cloud Access)
We use **Application Default Credentials (ADC)** to avoid handling sensitive JSON keys locally.
1. Run the login command:
   ```bash
   gcloud auth application-default login
   ```
2. The server will now use your local identity to access BigQuery.

---

## 3. Local Installation & Configuration

1. **Clone & Install**:
   ```bash
   git clone <repo-url>
   cd odata-gateway-bq
   npm install
   cd frontend && npm install
   ```

> [!NOTE]
> If you encounter missing UI components in the frontend (e.g., checkbox, progress), ensure you have installed them via shadcn: `cd frontend && npx shadcn@latest add checkbox progress`.

2. **Configure Environment**:
   Copy the example template and fill in your values:
   ```bash
   cp .env.example .env
   ```
   
   A typical `.env` for local testing looks like this:
   ```env
   # Mandatory for BQ Execution
   BQ_BILLING_PROJECT_ID="your-gcp-project-id"

   # OIDC Configuration (From Step 2A)
   OIDC_ISSUER="https://login.microsoftonline.com/{tenant}/v2.0"
   OIDC_AUDIENCE="your-dev-client-id"

   # Optional: Path to custom tenants.yaml (Default: backend/config/tenants.yaml)
   # TENANTS_CONFIG_PATH="dev-tenant.yaml"

   # Optional: For quick testing without Azure AD
   ANONYMOUS_MODE=true

   # MSW Mocking (Set to true only for mocked tests)
   NEXT_PUBLIC_API_MOCKING=false
   ```

3. **Tenant Configuration**:
   If you are using a custom `tenants.yaml` (as configured in step 2 above), copy the template and update it with your GCP details:
   ```bash
   cp dev-tenants.yaml.example dev-tenants.yaml
   ```
   
   > [!IMPORTANT]
   > For local development in `ANONYMOUS_MODE`, you can omit the `access_rules` section in `dev-tenants.yaml` to allow unrestricted access to your development datasets.

---

## 4. Development Workflow

### Running the Server
Start both backend and frontend simultaneously with hot-reloading:
```bash
npm run dev
```
- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:3000

> [!TIP]
> The backend compiled code resides in `backend/dist/backend/src/app.js`. This nested structure is due to the inclusion of shared libraries in the build.

### Code Structure Conventions
- **src/plugins/**: Shared services (Auth, BQ Client, Caching).
- **src/routes/v1/**: API endpoint definitions.
- **src/services/**: Direct cloud SDK interactions and complex domain logic.
- **odata-v4-gcp/**: The hand-written OData translation engine (Lexer, Parser, Translator).
- **common/**: Shared TypeScript types between Frontend and Backend.

---

## 5. Testing & Verification

### Standard Testing
Runs the full suite using mocks for Cloud services:
```bash
npm test
```

### Live Integration Mode (Recommended for Final Verification)
To verify your real Azure/GCP configuration, run the tests in **Live Mode**:
```bash
export LIVE_TEST=true
npm test
```
*In this mode, the server performs real OIDC discovery and submits real BigQuery jobs.*

---

## 6. Mocking with MSW (Optional)

The frontend includes **Mock Service Worker (MSW)** for testing or offline development.

1.  **Enable Mocking**: Set `NEXT_PUBLIC_API_MOCKING=true` in your `.env` file.
2.  **Configuration**: Mocks are located in `frontend/src/mocks/`.
3.  **Note**: By default, MSW is disabled to allow direct communication with your local backend.

---

## 🏗️ Best Practices & Architecture
- **Trusted Subsystem**: The server runs with its own identity. User identity is propagated via BigQuery **Job Labels** (`user_identity`) for auditing.
- **Zero-Buffered Streams**: Data is streamed from BigQuery to the client using Node.js `Transform` streams. Avoid `toJSON()` or array buffering for large datasets.
- **Schema Discovery**: Metadata is cached in-memory and refreshed via `POST /admin/refresh-all`.

For a deeper dive into the system design, see the [System Architecture](./architecture.md) guide.
