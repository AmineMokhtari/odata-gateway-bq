#!/bin/bash
# ==============================================================================
# obq-gateway Publish Script (Bash)
# ==============================================================================
# This script builds and publishes the `obq-gateway` Docker image using GCP 
# Cloud Build. It avoids the need for a local Docker daemon by delegating the 
# build process to Google Cloud infrastructure.
#
# Build Context Explanation:
# The `obq-gateway` service depends on the shared `common/` package located at 
# the root of the monorepo. Therefore, the Docker build context must be the 
# root directory (`..`), rather than the `obq-gateway` directory itself.
# ==============================================================================
set -e

PROJECT_ID="your-gcp-project-id"
REGION="us-central1"
REPOSITORY="your-repo-name"
IMAGE_NAME="obq-gateway"
TAG="latest"

show_help() {
    echo "Usage: ./publish.sh [OPTIONS]"
    echo "Builds and publishes the obq-gateway Docker image to GCP Artifact Registry via Cloud Build."
    echo ""
    echo "Options:"
    echo "  -p,    --project-id      GCP Project ID (default: $PROJECT_ID)"
    echo "  -r,    --region          GCP Region (default: $REGION)"
    echo "  -repo, --repository      Artifact Registry Repository (default: $REPOSITORY)"
    echo "  -i,    --image-name      Docker Image Name (default: $IMAGE_NAME)"
    echo "  -t,    --tag             Docker Image Tag (default: $TAG)"
    echo "  -h,    --help            Show this help message and exit"
}

# Parse named parameters
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -p|--project-id) PROJECT_ID="$2"; shift ;;
        -r|--region) REGION="$2"; shift ;;
        -repo|--repository) REPOSITORY="$2"; shift ;;
        -i|--image-name) IMAGE_NAME="$2"; shift ;;
        -t|--tag) TAG="$2"; shift ;;
        -h|--help) show_help; exit 0 ;;
        *) echo "Unknown parameter passed: $1"; show_help; exit 1 ;;
    esac
    shift
done

# Construct the full image path required by Artifact Registry
IMAGE_PATH="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:${TAG}"

echo "Submitting build to GCP Cloud Build..."
# Shift directory to the root to ensure the build context includes `common/`
pushd .. > /dev/null

# Submit the build to GCP Cloud Build
# --project: Specifies the billing and execution project
# --config: Points to the cloudbuild.yaml file located inside the obq-gateway folder
# --substitutions: Passes the computed image path into the cloudbuild.yaml step
gcloud builds submit --project "${PROJECT_ID}" --config obq-gateway/cloudbuild.yaml --substitutions "_IMAGE_PATH=${IMAGE_PATH}" .

popd > /dev/null

echo "Done! Image published to ${IMAGE_PATH}"
