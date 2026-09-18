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
# CI Test Runner Script
# ==============================================================================
# Runs boundary checks, builds dependencies, compiles test types, and executes
# backend unit and integration test suites with idempotent isolation.
#
# Must be executed from the repository root:
#   ./scripts/ci/test.sh
# ==============================================================================
set -euo pipefail

# Ensure script is executed from repo root
if [[ ! -f "package.json" ]]; then
  echo "🚨 [CI Test Error]: Script must be run from the repository root." >&2
  exit 1
fi

echo "========================================="
echo "1. Validating Git Boundaries"
echo "========================================="
./scripts/ci/validate-git-boundary.sh

echo ""
echo "========================================="
echo "2. Building Backend TypeScript"
echo "========================================="
npm run build:backend

echo ""
echo "========================================="
echo "3. Compiling Test TypeScript Config"
echo "========================================="
npx tsc -p obq-gateway/test/tsconfig.json

echo ""
echo "========================================="
echo "4. Executing Test Suites"
echo "========================================="

export TENANTS_CONFIG_PATH="${TENANTS_CONFIG_PATH:-obq-gateway/config/tenants.yaml}"
export OIDC_ISSUER="${OIDC_ISSUER:-http://localhost/}"
export OIDC_AUDIENCE="${OIDC_AUDIENCE:-test-audience}"
export BQ_BILLING_PROJECT_ID="${BQ_BILLING_PROJECT_ID:-test-project}"
export GCP_WORKLOAD_POOL_ID="${GCP_WORKLOAD_POOL_ID:-test-project}"
export GCP_WORKLOAD_PROVIDER_ID="${GCP_WORKLOAD_PROVIDER_ID:-test-provider}"
export FASTIFY_AUTOLOAD_TYPESCRIPT="1"

node --test --test-concurrency 1 --import tsx obq-gateway/test/**/*.test.ts

echo ""
echo "✅ [CI Test Suite]: All tests passed successfully!"

