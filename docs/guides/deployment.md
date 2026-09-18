# How-To Guide: Deploying to Google Cloud Run

This guide provides the exact steps to build, publish, and deploy the **odata-gateway-bq** services (`obq-gateway` and `obq-hub`) to Google Cloud Run using the standardized CI/CD and deployment scripts located in `scripts/`.

---

## Prerequisites

Before starting your deployment, ensure you have:
- Authenticated `gcloud` CLI (`gcloud auth login` or service account credentials).
- The Cloud Build API (`cloudbuild.googleapis.com`) and Cloud Run API (`run.googleapis.com`) enabled on your target GCP project.
- Appropriate IAM permissions (e.g., Cloud Build Editor, Cloud Run Admin, Artifact Registry Writer).
- An existing Docker repository in **GCP Artifact Registry** in the target region.

---

## Pre-Deployment CI Checks

Before building and deploying images, verify that your code adheres to security boundaries, licensing, and passing tests using the vendor-agnostic CI scripts:

```bash
# 1. Run full CI test suite (git boundaries, TypeScript compilation, unit/integration tests)
./scripts/ci/test.sh

# 2. Verify license headers and Markdown documentation
./scripts/ci/lint.sh
```

---

## Building and Publishing Container Images

You can publish images using either **Google Cloud Build** (recommended, requires no local Docker daemon) or a **local Docker daemon**.

### Option A: Publishing via Google Cloud Build (Recommended)

Cloud Build compiles and pushes both microservices from the repository root, ensuring shared dependencies (`common/`) are included in the build context.

#### Publish All Services

**Using Bash:**
```bash
./scripts/deploy/publish-cloud-build.sh -p <PROJECT_ID> -r <REGION> -repo <REPOSITORY_NAME> -t <TAG>
```
*(Alternatively, you can run `./publish.sh` which forwards directly to this script).*

**Using PowerShell:**
```powershell
.\scripts\deploy\publish.ps1 -p <PROJECT_ID> -r <REGION> -repo <REPOSITORY_NAME> -t <TAG>
```

#### Publish an Individual Service

To publish only the Gateway backend (`obq-gateway`) or Hub frontend (`obq-hub`), use the `-s` / `--service` flag:

**Gateway Backend Only:**
```bash
./scripts/deploy/publish-cloud-build.sh -s obq-gateway -p <PROJECT_ID> -r <REGION> -repo <REPOSITORY_NAME> -t <TAG>
```

**Hub Frontend Only:**
```bash
./scripts/deploy/publish-cloud-build.sh -s obq-hub -p <PROJECT_ID> -r <REGION> -repo <REPOSITORY_NAME> -t <TAG>
```

---

### Option B: Building & Pushing via Local Docker

If you have a local Docker daemon and preferred registry authentication (`gcloud auth configure-docker`):

1. **Build and Push in One Step:**
   ```bash
   ./scripts/deploy/build-and-push.sh \
     --backend-image <REGION>-docker.pkg.dev/<PROJECT_ID>/<REPOSITORY>/obq-gateway:<TAG> \
     --frontend-image <REGION>-docker.pkg.dev/<PROJECT_ID>/<REPOSITORY>/obq-hub:<TAG>
   ```

2. **Or Run Granular Build & Push Separately:**
   ```bash
   # Build images locally
   ./scripts/deploy/build-docker.sh -s all -b <BACKEND_IMAGE> -f <FRONTEND_IMAGE>

   # Push to registry
   ./scripts/deploy/push-docker.sh -s all -b <BACKEND_IMAGE> -f <FRONTEND_IMAGE>
   ```

---

## Deploying to Google Cloud Run

Once images are published to Artifact Registry or Container Registry, deploy them to Cloud Run using `./scripts/deploy/deploy-cloud-run.sh`. This script is idempotent: it provisions the service if it does not exist, or creates a new revision if it does.

### Deploying Both Services

```bash
./scripts/deploy/deploy-cloud-run.sh \
  --project-id <PROJECT_ID> \
  --region <REGION> \
  --backend-image <REGION>-docker.pkg.dev/<PROJECT_ID>/<REPOSITORY>/obq-gateway:<TAG> \
  --frontend-image <REGION>-docker.pkg.dev/<PROJECT_ID>/<REPOSITORY>/obq-hub:<TAG>
```

### Deploying a Single Service

**Backend Gateway Only:**
```bash
./scripts/deploy/deploy-cloud-run.sh \
  -s backend \
  --project-id <PROJECT_ID> \
  --region <REGION> \
  --backend-image <REGION>-docker.pkg.dev/<PROJECT_ID>/<REPOSITORY>/obq-gateway:<TAG> \
  --service-account <SERVICE_ACCOUNT_EMAIL>
```

**Frontend Hub Only:**
```bash
./scripts/deploy/deploy-cloud-run.sh \
  -s frontend \
  --project-id <PROJECT_ID> \
  --region <REGION> \
  --frontend-image <REGION>-docker.pkg.dev/<PROJECT_ID>/<REPOSITORY>/obq-hub:<TAG>
```

---

## Automated CI/CD via GitHub Actions

The repository includes a decoupled GitHub Actions workflow at [`.github/workflows/deploy-cloud-run.yml`](../../.github/workflows/deploy-cloud-run.yml).

### How It Works

The workflow separates CI/CD orchestration from procedural shell logic:
1. **CI Job (`test`)**: Checks out the code and executes `./scripts/ci/test.sh`.
2. **CD Job (`deploy`)**: Authenticates to Google Cloud via Workload Identity / Service Account key, configures Docker credentials, executes `./scripts/deploy/build-and-push.sh`, and triggers `./scripts/deploy/deploy-cloud-run.sh`.

### Configuration Requirements

To enable automated deployments on merge to `main`:
1. Configure GitHub Repository Secrets:
   - `GCP_PROJECT_ID`: Target GCP Project ID.
   - `GCP_SA_KEY`: Service Account key JSON with Cloud Run and Artifact Registry permissions.
2. Push commits to `main` to trigger the automated test and deployment pipeline.
