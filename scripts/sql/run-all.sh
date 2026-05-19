#!/bin/bash

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
