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
# Cloud Run Deployment Script
# ==============================================================================
# Deploys obq-gateway (backend) and obq-hub (frontend) container images to
# Google Cloud Run idempotently.
#
# Must be executed from the repository root:
#   ./scripts/deploy/deploy-cloud-run.sh [OPTIONS]
# ==============================================================================
set -euo pipefail

# Ensure script is executed from repo root
if [[ ! -f "package.json" ]]; then
  echo "🚨 [Deploy Cloud Run Error]: Script must be run from the repository root." >&2
  exit 1
fi

SERVICE="all"
PROJECT_ID="${PROJECT_ID:-}"
REGION="${REGION:-us-central1}"
BACKEND_SERVICE_NAME="${BACKEND_SERVICE_NAME:-odata-bq-backend}"
FRONTEND_SERVICE_NAME="${FRONTEND_SERVICE_NAME:-odata-bq-frontend}"
BACKEND_IMAGE="${BACKEND_IMAGE:-}"
FRONTEND_IMAGE="${FRONTEND_IMAGE:-}"
SERVICE_ACCOUNT="${SERVICE_ACCOUNT:-}"
ALLOW_UNAUTHENTICATED="${ALLOW_UNAUTHENTICATED:-true}"

show_help() {
  cat << EOF
Usage: ./scripts/deploy/deploy-cloud-run.sh [OPTIONS]

Deploys obq microservices to Google Cloud Run.

Options:
  -s, --service                Target service: all, backend (or gateway), frontend (or hub). (default: $SERVICE)
  -p, --project-id             GCP Project ID. (env: PROJECT_ID)
  -r, --region                 GCP Region. (default: $REGION, env: REGION)
  -b, --backend-image          Backend image URI. (env: BACKEND_IMAGE)
  -f, --frontend-image         Frontend image URI. (env: FRONTEND_IMAGE)
      --backend-service-name   Cloud Run backend service name. (default: $BACKEND_SERVICE_NAME)
      --frontend-service-name  Cloud Run frontend service name. (default: $FRONTEND_SERVICE_NAME)
      --service-account        Service account email for Cloud Run service.
      --no-allow-unauth        Disallow unauthenticated access (default: allow unauthenticated).
  -h, --help                   Show this help message and exit.
EOF
}

while [[ "$#" -gt 0 ]]; do
  case $1 in
    -s|--service) SERVICE="$2"; shift ;;
    -p|--project-id) PROJECT_ID="$2"; shift ;;
    -r|--region) REGION="$2"; shift ;;
    -b|--backend-image) BACKEND_IMAGE="$2"; shift ;;
    -f|--frontend-image) FRONTEND_IMAGE="$2"; shift ;;
    --backend-service-name) BACKEND_SERVICE_NAME="$2"; shift ;;
    --frontend-service-name) FRONTEND_SERVICE_NAME="$2"; shift ;;
    --service-account) SERVICE_ACCOUNT="$2"; shift ;;
    --no-allow-unauth) ALLOW_UNAUTHENTICATED="false" ;;
    -h|--help) show_help; exit 0 ;;
    *) echo "Unknown option: $1" >&2; show_help; exit 1 ;;
  esac
  shift
done

# If project ID is still empty, attempt to infer from gcloud config
if [[ -z "$PROJECT_ID" ]]; then
  PROJECT_ID=$(gcloud config get-value project 2>/dev/null || true)
fi

deploy_backend() {
  if [[ -z "$BACKEND_IMAGE" ]]; then
    echo "🚨 Error: BACKEND_IMAGE must be specified either via -b/--backend-image or env var BACKEND_IMAGE." >&2
    exit 1
  fi

  echo "========================================="
  echo "Deploying Backend: $BACKEND_SERVICE_NAME"
  echo "Image: $BACKEND_IMAGE"
  echo "Region: $REGION"
  echo "========================================="

  local cmd=(
    gcloud run deploy "$BACKEND_SERVICE_NAME"
    --image "$BACKEND_IMAGE"
    --region "$REGION"
    --platform managed
  )

  if [[ -n "$PROJECT_ID" ]]; then
    cmd+=(--project "$PROJECT_ID")
  fi

  if [[ "$ALLOW_UNAUTHENTICATED" == "true" ]]; then
    cmd+=(--allow-unauthenticated)
  else
    cmd+=(--no-allow-unauthenticated)
  fi

  if [[ -n "$SERVICE_ACCOUNT" ]]; then
    cmd+=(--service-account "$SERVICE_ACCOUNT")
  fi

  "${cmd[@]}"
  echo "✅ Successfully deployed $BACKEND_SERVICE_NAME to Cloud Run."
}

deploy_frontend() {
  if [[ -z "$FRONTEND_IMAGE" ]]; then
    echo "🚨 Error: FRONTEND_IMAGE must be specified either via -f/--frontend-image or env var FRONTEND_IMAGE." >&2
    exit 1
  fi

  echo "========================================="
  echo "Deploying Frontend: $FRONTEND_SERVICE_NAME"
  echo "Image: $FRONTEND_IMAGE"
  echo "Region: $REGION"
  echo "========================================="

  local cmd=(
    gcloud run deploy "$FRONTEND_SERVICE_NAME"
    --image "$FRONTEND_IMAGE"
    --region "$REGION"
    --platform managed
  )

  if [[ -n "$PROJECT_ID" ]]; then
    cmd+=(--project "$PROJECT_ID")
  fi

  if [[ "$ALLOW_UNAUTHENTICATED" == "true" ]]; then
    cmd+=(--allow-unauthenticated)
  else
    cmd+=(--no-allow-unauthenticated)
  fi

  if [[ -n "$SERVICE_ACCOUNT" ]]; then
    cmd+=(--service-account "$SERVICE_ACCOUNT")
  fi

  "${cmd[@]}"
  echo "✅ Successfully deployed $FRONTEND_SERVICE_NAME to Cloud Run."
}

case "$SERVICE" in
  all)
    deploy_backend
    echo ""
    deploy_frontend
    ;;
  backend|gateway|obq-gateway)
    deploy_backend
    ;;
  frontend|hub|obq-hub)
    deploy_frontend
    ;;
  *)
    echo "🚨 Unknown service: $SERVICE. Permitted values: all, backend, frontend" >&2
    exit 1
    ;;
esac

echo ""
echo "🎉 Cloud Run deployment finished successfully!"

