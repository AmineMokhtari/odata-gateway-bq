#!/bin/bash
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
# Master Publish Script (Bash)
# ==============================================================================
# This script orchestrates the build and publish process for all microservices 
# in the OData Gateway project (obq-gateway and obq-hub).
# 
# It delegates the actual build execution to GCP Cloud Build by calling the 
# individual publish.sh scripts located in each service directory.
#
# Usage:
#   ./publish.sh -p <PROJECT_ID> -r <REGION> -repo <REPOSITORY_NAME> -t <TAG>
# ==============================================================================
set -e

PROJECT_ID="your-gcp-project-id"
REGION="us-central1"
REPOSITORY="your-repo-name"
TAG="latest"

show_help() {
    echo "Usage: ./publish.sh [OPTIONS]"
    echo "Builds and publishes both obq-gateway and obq-hub Docker images via Cloud Build."
    echo ""
    echo "Options:"
    echo "  -p,    --project-id      GCP Project ID (default: $PROJECT_ID)"
    echo "  -r,    --region          GCP Region (default: $REGION)"
    echo "  -repo, --repository      Artifact Registry Repository (default: $REPOSITORY)"
    echo "  -t,    --tag             Docker Image Tag (default: $TAG)"
    echo "  -h,    --help            Show this help message and exit"
}

# Parse named parameters
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -p|--project-id) PROJECT_ID="$2"; shift ;;
        -r|--region) REGION="$2"; shift ;;
        -repo|--repository) REPOSITORY="$2"; shift ;;
        -t|--tag) TAG="$2"; shift ;;
        -h|--help) show_help; exit 0 ;;
        *) echo "Unknown parameter passed: $1"; show_help; exit 1 ;;
    esac
    shift
done

echo "========================================="
echo "Publishing obq-gateway..."
echo "========================================="
# Navigate to the obq-gateway directory and invoke its specific publish script
pushd obq-gateway > /dev/null
./publish.sh -p "$PROJECT_ID" -r "$REGION" -repo "$REPOSITORY" -t "$TAG"
popd > /dev/null

echo ""
echo "========================================="
echo "Publishing obq-hub..."
echo "========================================="
# Navigate to the obq-hub directory and invoke its specific publish script
pushd obq-hub > /dev/null
./publish.sh -p "$PROJECT_ID" -r "$REGION" -repo "$REPOSITORY" -t "$TAG"
popd > /dev/null

echo ""
echo "Successfully published both obq-gateway and obq-hub!"
