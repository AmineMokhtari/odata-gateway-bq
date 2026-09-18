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
# Docker Image Push Script
# ==============================================================================
# Pushes Docker images for obq-gateway and/or obq-hub to a container registry.
#
# Must be executed from the repository root:
#   ./scripts/deploy/push-docker.sh [OPTIONS]
# ==============================================================================
set -euo pipefail

# Ensure script is executed from repo root
if [[ ! -f "package.json" ]]; then
  echo "🚨 [Push Docker Error]: Script must be run from the repository root." >&2
  exit 1
fi

SERVICE="all"
BACKEND_IMAGE="${BACKEND_IMAGE:-obq-gateway:latest}"
FRONTEND_IMAGE="${FRONTEND_IMAGE:-obq-hub:latest}"

show_help() {
  cat << EOF
Usage: ./scripts/deploy/push-docker.sh [OPTIONS]

Pushes Docker images for obq-gateway and obq-hub to a registry.

Options:
  -s, --service          Target service: all, gateway (or obq-gateway), hub (or obq-hub). (default: $SERVICE)
  -b, --backend-image    Image URI/tag for backend. (default: $BACKEND_IMAGE)
  -f, --frontend-image   Image URI/tag for frontend. (default: $FRONTEND_IMAGE)
  -h, --help             Show this help message and exit.

Environment variables:
  BACKEND_IMAGE          Overrides default backend image name.
  FRONTEND_IMAGE         Overrides default frontend image name.
EOF
}

while [[ "$#" -gt 0 ]]; do
  case $1 in
    -s|--service) SERVICE="$2"; shift ;;
    -b|--backend-image) BACKEND_IMAGE="$2"; shift ;;
    -f|--frontend-image) FRONTEND_IMAGE="$2"; shift ;;
    -h|--help) show_help; exit 0 ;;
    *) echo "Unknown option: $1" >&2; show_help; exit 1 ;;
  esac
  shift
done

push_backend() {
  echo "========================================="
  echo "Pushing obq-gateway: $BACKEND_IMAGE"
  echo "========================================="
  docker push "$BACKEND_IMAGE"
  echo "✅ Successfully pushed $BACKEND_IMAGE"
}

push_frontend() {
  echo "========================================="
  echo "Pushing obq-hub: $FRONTEND_IMAGE"
  echo "========================================="
  docker push "$FRONTEND_IMAGE"
  echo "✅ Successfully pushed $FRONTEND_IMAGE"
}

case "$SERVICE" in
  all)
    push_backend
    echo ""
    push_frontend
    ;;
  gateway|obq-gateway|backend)
    push_backend
    ;;
  hub|obq-hub|frontend)
    push_frontend
    ;;
  *)
    echo "🚨 Unknown service: $SERVICE. Permitted values: all, gateway, hub" >&2
    exit 1
    ;;
esac

echo ""
echo "🎉 Push completed successfully."

