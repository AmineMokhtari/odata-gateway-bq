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
# BigQuery SQL Batch Seeder Script
# ==============================================================================
# Executes all SQL data product definition and seed scripts for insurance schemas
# in Google BigQuery idempotently.
#
# Must be executed from the repository root:
#   ./scripts/sql/run-all.sh [OPTIONS]
# ==============================================================================
set -euo pipefail

# Ensure script is executed from repo root
if [[ ! -f "package.json" ]] || [[ ! -d "scripts/sql" ]]; then
  echo "🚨 [SQL Runner Error]: Script must be run from the repository root." >&2
  exit 1
fi

LOCATION="europe-west1"
PROJECT_ID=""
RECREATE="false"

show_help() {
  cat << EOF
Usage: ./scripts/sql/run-all.sh [OPTIONS] [LOCATION] [PROJECT_ID]

Executes all BigQuery SQL initialization and data product scripts.

Options:
  -l, --location     BigQuery dataset location. (default: europe-west1)
  -p, --project-id   GCP Project ID. (default: current gcloud project or PROJECT_ID env)
      --clean        Drop existing datasets before execution (recreate fresh state).
      --recreate     Alias for --clean.
  -h, --help         Show this help message and exit.

Positional arguments:
  LOCATION           Overrides default location.
  PROJECT_ID         Overrides default project ID.
EOF
}

# Parse options
POSITIONAL_ARGS=()
while [[ "$#" -gt 0 ]]; do
  case $1 in
    -l|--location) LOCATION="$2"; shift ;;
    -p|--project-id) PROJECT_ID="$2"; shift ;;
    --clean|--recreate) RECREATE="true" ;;
    -h|--help) show_help; exit 0 ;;
    -*) echo "Unknown option: $1" >&2; show_help; exit 1 ;;
    *) POSITIONAL_ARGS+=("$1") ;;
  esac
  shift
done

# Handle legacy positional arguments if provided
if [[ ${#POSITIONAL_ARGS[@]} -ge 1 && -n "${POSITIONAL_ARGS[0]}" ]]; then
  LOCATION="${POSITIONAL_ARGS[0]}"
fi
if [[ ${#POSITIONAL_ARGS[@]} -ge 2 && -n "${POSITIONAL_ARGS[1]}" ]]; then
  PROJECT_ID="${POSITIONAL_ARGS[1]}"
fi

# Fall back to env var or gcloud config
if [[ -z "$PROJECT_ID" ]]; then
  PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || true)}"
fi

if [[ -z "$PROJECT_ID" ]]; then
  echo "🚨 Error: Could not determine GCP Project ID. Provide via -p/--project-id or set 'gcloud config set project <id>'." >&2
  exit 1
fi

echo "========================================="
echo "BigQuery SQL Runner"
echo "Location:   $LOCATION"
echo "Project ID: $PROJECT_ID"
echo "Recreate:   $RECREATE"
echo "========================================="

SQL_DIR="scripts/sql"

if [[ "$RECREATE" == "true" ]]; then
  DROP_SCRIPT="$SQL_DIR/insurance/drop_all_datasets.sql"
  if [[ -f "$DROP_SCRIPT" ]]; then
    echo "========================================"
    echo "Dropping existing datasets for idempotent refresh: $DROP_SCRIPT..."
    echo "========================================"
    bq query --use_legacy_sql=false --location="$LOCATION" --project_id="$PROJECT_ID" < "$DROP_SCRIPT"
    echo "✅ Datasets dropped successfully."
    echo ""
  fi
fi

echo "Running all SQL data product scripts in $SQL_DIR..."
# Find and sort all .sql files excluding drop_all_datasets.sql
while IFS= read -r file; do
  echo "========================================"
  echo "Executing: $file..."
  echo "========================================"
  bq query --use_legacy_sql=false --location="$LOCATION" --project_id="$PROJECT_ID" < "$file"
  echo "✅ Successfully executed $file."
  echo ""
done < <(find "$SQL_DIR" -type f -name "*.sql" ! -name "drop_all_datasets.sql" | sort)

echo "🎉 All SQL scripts executed successfully!"
