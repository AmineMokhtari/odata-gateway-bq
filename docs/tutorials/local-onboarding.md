# Tutorial: Local Developer Onboarding

Welcome to the **odata-gateway-bq** project! This tutorial will guide you step-by-step through setting up a fresh clone into a running, verified local development environment.

## Prerequisites

Before starting this tutorial, ensure you have installed:
- **Node.js**: v20.x or later.
- **TypeScript**: v5.x.
- **Google Cloud CLI**: [Installed and added to your PATH](https://cloud.google.com/sdk/docs/install).

---

## Step 1: Authenticate with Google Cloud

We use Application Default Credentials (ADC) so the server can securely access BigQuery using your local identity.

1. Open your terminal.
2. Run the following command:
   ```bash
   gcloud auth application-default login
   ```
3. A browser window will open. Sign in with your Google Cloud credentials and allow access.

---

## Step 2: Clone and Install Dependencies

1. Clone the repository to your local machine:
   ```bash
   git clone <repo-url>
   cd odata-gateway-bq
   ```
2. Install the backend dependencies:
   ```bash
   npm install
   ```
3. Install the frontend (Catalog UI) dependencies:
   ```bash
   cd obq-hub
   npm install
   ```

---

## Step 3: Configure Your Environment

The project requires environment files to run. We will start by copying the provided templates.

1. Navigate back to the project root:
   ```bash
   cd ..
   ```
2. Copy the example `.env` file:
   ```bash
   cp .env.example .env
   ```
3. Copy the example tenant configuration:
   ```bash
   cp dev-tenants.yaml.example dev-tenants.yaml
   ```

---

## Step 4: Configure Anonymous Mode (Quick Start)

For local development without needing to set up an identity provider (like Azure AD) immediately, we will configure the system to run in Anonymous Mode.

1. Open your new `.env` file in a text editor.
2. Update the file to include your Google Cloud Project ID and enable anonymous access:

   ```env
   BQ_BILLING_PROJECT_ID="your-gcp-project-id"
   ANONYMOUS_MODE=true
   DEFAULT_ANONYMOUS_USER_NAME="Local Developer"
   OIDC_ISSUER=""
   OIDC_AUDIENCE=""
   ```

3. Open your new `dev-tenants.yaml` file.
4. Set up a simple development tenant without access rules:

   ```yaml
   tenants:
     - id: dev-tenant
       name: "Development Tenant"
       bigquery:
         projectId: "your-gcp-project-id"
         datasets: ["your_dataset_name"]
   ```

---

## Step 5: Run the Application

You are now ready to start the gateway and the frontend catalog UI simultaneously.

1. In your terminal at the project root, run:
   ```bash
   npm run dev
   ```
2. Open your web browser.
3. Navigate to **`http://localhost:3000`** to view the Catalog UI.
4. The Backend API is running silently at `http://127.0.0.1:3002`.

Congratulations! You have successfully set up your local development environment.

> [!TIP]
> To configure authentication with Microsoft Entra ID (OIDC) instead of Anonymous mode, refer to the [How-To Guide: Configuring Entra ID Authentication](../guides/configuring-entra-id.md).
