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
# Git Boundary Verification Script
# ==============================================================================
# Verifies that sensitive paths (e.g. Playwright authentication sessions) are
# safely ignored by git and not tracked in the index.
#
# Must be executed from the repository root:
#   ./scripts/ci/validate-git-boundary.sh
# ==============================================================================
set -euo pipefail

# Ensure script is executed from repo root
if [[ ! -f "package.json" ]]; then
  echo "🚨 [Git Boundary Error]: Script must be run from the repository root." >&2
  exit 1
fi

# Programmatically verify git ignores playwright/.auth/session.json
if ! git check-ignore -q playwright/.auth/session.json; then
  echo "🚨 [Git Boundary Failure]: 'playwright/.auth/' is NOT ignored in .gitignore!" >&2
  exit 1
fi

# Check if any files inside playwright/.auth/ are tracked or staged
TRACKED_AUTH_FILES=$(git ls-files "playwright/.auth/")
if [[ -n "$TRACKED_AUTH_FILES" ]]; then
  echo "🚨 [Git Boundary Failure]: The following authentication credentials are tracked by git:" >&2
  echo "$TRACKED_AUTH_FILES" >&2
  exit 2
fi

echo "✅ [Git Boundary Verification]: Playwright authentication path is safely ignored and free of secrets."
exit 0

