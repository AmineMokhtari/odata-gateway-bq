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

# Exit on error
set -e

# Default location is europe-west1, but can be overridden via first argument
LOCATION=${1:-europe-west1}

# Default project_id is the current gcloud project, but can be overridden via second argument
DEFAULT_PROJECT=$(gcloud config get project)
PROJECT_ID=${2:-$DEFAULT_PROJECT}

echo "Using BigQuery location: $LOCATION"
echo "Using Google Cloud Project: $PROJECT_ID"

# Change to the directory of this script so it can be run from anywhere
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "Creating BigQuery dataset 'demo_dataset' if it doesn't exist..."
# bq mk -d --location=$LOCATION --project_id=$PROJECT_ID demo_dataset || true

echo "Running all SQL scripts recursively in $DIR (excluding drop_all_datasets.sql)..."
find . -type f -name "*.sql" ! -name "drop_all_datasets.sql" | sort | while read -r file; do
    echo "========================================"
    echo "Executing $file..."
    echo "========================================"
    bq query --use_legacy_sql=false --location=$LOCATION --project_id=$PROJECT_ID < "$file"
    echo "Successfully executed $file."
    echo ""
done

echo "All SQL scripts executed successfully!"
