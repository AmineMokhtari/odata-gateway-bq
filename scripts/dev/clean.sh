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
# Development Environment Cleanup Script
# ==============================================================================
# Idempotently releases development ports and cleans Next.js build cache.
#
# Must be executed from the repository root:
#   ./scripts/dev/clean.sh
# ==============================================================================
set -euo pipefail

# Ensure script is executed from repo root
if [[ ! -f "package.json" ]]; then
  echo "🚨 [Dev Clean Error]: Script must be run from the repository root." >&2
  exit 1
fi

GATEWAY_PORT="80"
HUB_PORT="3000"

if [[ -f ".env" ]]; then
  # Parse port if configured in .env
  EXTRACTED_GW=$(grep -E '^GATEWAY_URL=' .env | cut -d '=' -f2 | sed -e 's|http[s]*://[^:]*:||' -e 's|/.*||' || true)
  if [[ -n "$EXTRACTED_GW" && "$EXTRACTED_GW" =~ ^[0-9]+$ ]]; then
    GATEWAY_PORT="$EXTRACTED_GW"
  fi

  EXTRACTED_HUB=$(grep -E '^HUB_URL=' .env | cut -d '=' -f2 | sed -e 's|http[s]*://[^:]*:||' -e 's|/.*||' || true)
  if [[ -n "$EXTRACTED_HUB" && "$EXTRACTED_HUB" =~ ^[0-9]+$ ]]; then
    HUB_PORT="$EXTRACTED_HUB"
  fi
fi

echo "========================================="
echo "Releasing dev ports ($GATEWAY_PORT, $HUB_PORT, 3001, 3002)..."
echo "========================================="

# Try kill-port via npx or fuser/lsof idempotently
if command -v npx >/dev/null 2>&1; then
  npx kill-port "$GATEWAY_PORT" "$HUB_PORT" 3001 3002 2>/dev/null || true
fi

for port in "$GATEWAY_PORT" "$HUB_PORT" 3001 3002; do
  if command -v fuser >/dev/null 2>&1; then
    fuser -k -n tcp "$port" 2>/dev/null || true
  fi
done

echo ""
echo "========================================="
echo "Cleaning Next.js compilation cache (.next)..."
echo "========================================="

NEXT_DIR="obq-hub/.next"
if [[ -d "$NEXT_DIR" ]]; then
  rm -rf "$NEXT_DIR"
  echo "✅ Deleted $NEXT_DIR cache folder."
else
  echo "ℹ️  No existing $NEXT_DIR folder found. Skipping clean."
fi

echo ""
echo "✅ Development environment cleaned successfully!"

