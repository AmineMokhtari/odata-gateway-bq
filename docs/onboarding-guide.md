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
3. **Set Redirect URI**: `http://localhost:3000` (Web).
4. **Permissions**: Add `User.Read` (Delegated).
5. **Note IDs**: Capture the **Client ID** and **Tenant ID**.

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
   ```

2. **Configure Environment**:
   Create a `.env` file in the root directory:
   ```env
   # Mandatory for BQ Execution
   BQ_BILLING_PROJECT_ID="your-gcp-project-id"

   # OIDC Configuration (From Step 2A)
   OIDC_ISSUER="https://login.microsoftonline.com/{tenant}/v2.0"
   OIDC_AUDIENCE="your-dev-client-id"

   # Optional: For quick testing without Azure AD
   # ANONYMOUS_MODE=true
   ```

---

## 4. Development Workflow

### Running the Server
Start the backend with hot-reloading:
```bash
npm run dev
```
- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:3000

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

## 🏗️ Best Practices & Architecture
- **Trusted Subsystem**: The server runs with its own identity. User identity is propagated via BigQuery **Job Labels** (`user_identity`) for auditing.
- **Zero-Buffered Streams**: Data is streamed from BigQuery to the client using Node.js `Transform` streams. Avoid `toJSON()` or array buffering for large datasets.
- **Schema Discovery**: Metadata is cached in-memory and refreshed via `POST /admin/refresh-all`.

For a deeper dive into the system design, see the [System Architecture](./architecture.md) guide.
