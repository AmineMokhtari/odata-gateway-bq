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
# Build and Push Runner Script
# ==============================================================================
# Orchestrates local Docker image build followed by pushing to a container
# registry for obq-gateway and/or obq-hub.
#
# Must be executed from the repository root:
#   ./scripts/deploy/build-and-push.sh [OPTIONS]
# ==============================================================================
set -euo pipefail

# Ensure script is executed from repo root
if [[ ! -f "package.json" ]]; then
  echo "🚨 [Build and Push Error]: Script must be run from the repository root." >&2
  exit 1
fi

./scripts/deploy/build-docker.sh "$@"
echo ""
./scripts/deploy/push-docker.sh "$@"

