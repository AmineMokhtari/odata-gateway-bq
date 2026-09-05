# How-To Guide: Deploying to Google Cloud Run

This guide provides the exact steps to build, publish, and deploy the **odata-gateway-bq** services (Gateway and Hub) to Google Cloud Run using GCP Cloud Build and Artifact Registry.

## Prerequisites

Before starting your deployment, ensure you have:
- Authenticated `gcloud` CLI.
- Cloud Build API enabled on your target project.
- Proper IAM permissions (e.g., Cloud Build Editor) to submit builds.
- An existing Docker repository in GCP Artifact Registry.

## How to Publish All Services Simultaneously

You can build and publish the Docker images for both `obq-gateway` and `obq-hub` using the provided root publish scripts. These scripts delegate the build process to GCP Cloud Build, removing the need for a local Docker installation.

### Using Bash (Mac/Linux)

1. Make the script executable:
   ```bash
   chmod +x publish.sh
   ```
2. Execute the script with your project details:
   ```bash
   ./publish.sh -p <PROJECT_ID> -r <REGION> -repo <REPOSITORY_NAME> -t <TAG>
   ```

### Using PowerShell (Windows)

Execute the script with your project details:
```powershell
.\publish.ps1 -p <PROJECT_ID> -r <REGION> -repo <REPOSITORY_NAME> -t <TAG>
```

## How to Publish Individual Services

If you only need to update a single service, navigate to its respective directory and run the localized script.

### For `obq-gateway`

**Bash:**
```bash
cd obq-gateway
chmod +x publish.sh
./publish.sh -p <PROJECT_ID> -r <REGION> -repo <REPOSITORY_NAME> -i <IMAGE_NAME> -t <TAG>
```

**PowerShell:**
```powershell
cd obq-gateway
.\publish.ps1 -p <PROJECT_ID> -r <REGION> -repo <REPOSITORY_NAME> -i <IMAGE_NAME> -t <TAG>
```

### For `obq-hub`

**Bash:**
```bash
cd obq-hub
chmod +x publish.sh
./publish.sh -p <PROJECT_ID> -r <REGION> -repo <REPOSITORY_NAME> -i <IMAGE_NAME> -t <TAG>
```

**PowerShell:**
```powershell
cd obq-hub
.\publish.ps1 -p <PROJECT_ID> -r <REGION> -repo <REPOSITORY_NAME> -i <IMAGE_NAME> -t <TAG>
```

## How to Deploy to Cloud Run

After the images are successfully published to Artifact Registry, you can deploy them using the `gcloud` CLI or by utilizing the provided CI/CD GitHub Action workflow.

### Deploying via gcloud CLI (Manual)

```bash
gcloud run deploy odata-gateway \
  --image <REGION>-docker.pkg.dev/<PROJECT_ID>/<REPOSITORY_NAME>/obq-gateway:<TAG> \
  --region <REGION> \
  --platform managed \
  --service-account <YOUR_SERVICE_ACCOUNT> \
  --set-env-vars BQ_BILLING_PROJECT_ID=<YOUR_PROJECT>,OIDC_ISSUER=<YOUR_ISSUER>,OIDC_AUDIENCE=<YOUR_AUDIENCE>
```

*(Repeat this process for the `obq-hub` image, ensuring the appropriate environment variables are passed).*

### Deploying via GitHub Actions (Automated CI/CD)

The project includes an automated deployment workflow located at `.github/workflows/deploy-cloud-run.yml`.
To use this:
1. Ensure you have configured the necessary GitHub Secrets (`GCP_PROJECT_ID`, `GCP_SA_KEY`).
2. Push your code to the `main` branch.
3. The workflow will automatically build and deploy both images to the configured Cloud Run region.
