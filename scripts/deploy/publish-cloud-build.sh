#!/usr/bin/env bash
# Copyright 2026 Google LLC
# 
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# 
#     https://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ==============================================================================
# Cloud Build Publisher Script
# ==============================================================================
# Builds and publishes Docker images to GCP Artifact Registry via Cloud Build.
# Runs directly from the monorepo root to properly capture shared dependencies.
#
# Must be executed from the repository root:
#   ./scripts/deploy/publish-cloud-build.sh [OPTIONS]
# ==============================================================================
set -euo pipefail

# Ensure script is executed from repo root
if [[ ! -f "package.json" ]] || [[ ! -d "obq-gateway" ]] || [[ ! -d "obq-hub" ]]; then
  echo "🚨 [Cloud Build Error]: Script must be run from the repository root." >&2
  exit 1
fi

PROJECT_ID="${PROJECT_ID:-your-gcp-project-id}"
REGION="${REGION:-us-central1}"
REPOSITORY="${REPOSITORY:-your-repo-name}"
SERVICE="all"
IMAGE_NAME=""
TAG="${TAG:-latest}"

show_help() {
  cat << EOF
Usage: ./scripts/deploy/publish-cloud-build.sh [OPTIONS]

Builds and publishes Docker images via GCP Cloud Build.

Options:
  -s,    --service          Service to build: all, gateway (or obq-gateway), hub (or obq-hub). (default: $SERVICE)
  -p,    --project-id       GCP Project ID. (default: $PROJECT_ID)
  -r,    --region           GCP Region. (default: $REGION)
  -repo, --repository       Artifact Registry Repository. (default: $REPOSITORY)
  -i,    --image-name       Override image name (applies when building single service).
  -t,    --tag              Docker Image Tag. (default: $TAG)
  -h,    --help             Show this help message and exit.
EOF
}

# Parse named parameters
while [[ "$#" -gt 0 ]]; do
  case $1 in
    -s|--service) SERVICE="$2"; shift ;;
    -p|--project-id) PROJECT_ID="$2"; shift ;;
    -r|--region) REGION="$2"; shift ;;
    -repo|--repository) REPOSITORY="$2"; shift ;;
    -i|--image-name) IMAGE_NAME="$2"; shift ;;
    -t|--tag) TAG="$2"; shift ;;
    -h|--help) show_help; exit 0 ;;
    *) echo "Unknown parameter passed: $1" >&2; show_help; exit 1 ;;
  esac
  shift
done

publish_gateway() {
  local target_image="${IMAGE_NAME:-obq-gateway}"
  local image_path="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${target_image}:${TAG}"
  echo "========================================="
  echo "Publishing obq-gateway to $image_path via Cloud Build..."
  echo "========================================="
  gcloud builds submit \
    --project "${PROJECT_ID}" \
    --config obq-gateway/cloudbuild.yaml \
    --substitutions "_IMAGE_PATH=${image_path}" \
    .
  echo "✅ Done! Image published to ${image_path}"
}

publish_hub() {
  local target_image="${IMAGE_NAME:-obq-hub}"
  local image_path="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${target_image}:${TAG}"
  echo "========================================="
  echo "Publishing obq-hub to $image_path via Cloud Build..."
  echo "========================================="
  gcloud builds submit \
    --project "${PROJECT_ID}" \
    --config obq-hub/cloudbuild.yaml \
    --substitutions "_IMAGE_PATH=${image_path}" \
    .
  echo "✅ Done! Image published to ${image_path}"
}

case "$SERVICE" in
  all)
    publish_gateway
    echo ""
    publish_hub
    ;;
  gateway|obq-gateway|backend)
    publish_gateway
    ;;
  hub|obq-hub|frontend)
    publish_hub
    ;;
  *)
    echo "🚨 Unknown service: $SERVICE. Permitted values: all, gateway, hub" >&2
    exit 1
    ;;
esac

echo ""
echo "🎉 Cloud Build publishing completed successfully!"

