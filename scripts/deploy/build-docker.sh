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
# Docker Image Build Script
# ==============================================================================
# Builds Docker images for obq-gateway and/or obq-hub microservices.
#
# Must be executed from the repository root:
#   ./scripts/deploy/build-docker.sh [OPTIONS]
# ==============================================================================
set -euo pipefail

# Ensure script is executed from repo root
if [[ ! -f "package.json" ]] || [[ ! -d "obq-gateway" ]] || [[ ! -d "obq-hub" ]]; then
  echo "🚨 [Build Docker Error]: Script must be run from the repository root." >&2
  exit 1
fi

SERVICE="all"
BACKEND_IMAGE="${BACKEND_IMAGE:-obq-gateway:latest}"
FRONTEND_IMAGE="${FRONTEND_IMAGE:-obq-hub:latest}"

show_help() {
  cat << EOF
Usage: ./scripts/deploy/build-docker.sh [OPTIONS]

Builds Docker images for obq-gateway and obq-hub.

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

build_backend() {
  echo "========================================="
  echo "Building obq-gateway: $BACKEND_IMAGE"
  echo "========================================="
  docker build -t "$BACKEND_IMAGE" -f obq-gateway/Dockerfile .
  echo "✅ Successfully built $BACKEND_IMAGE"
}

build_frontend() {
  echo "========================================="
  echo "Building obq-hub: $FRONTEND_IMAGE"
  echo "========================================="
  docker build -t "$FRONTEND_IMAGE" -f obq-hub/Dockerfile .
  echo "✅ Successfully built $FRONTEND_IMAGE"
}

case "$SERVICE" in
  all)
    build_backend
    echo ""
    build_frontend
    ;;
  gateway|obq-gateway|backend)
    build_backend
    ;;
  hub|obq-hub|frontend)
    build_frontend
    ;;
  *)
    echo "🚨 Unknown service: $SERVICE. Permitted values: all, gateway, hub" >&2
    exit 1
    ;;
esac

echo ""
echo "🎉 Build completed successfully."

