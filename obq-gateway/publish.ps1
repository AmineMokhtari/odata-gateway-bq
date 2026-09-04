/*
Copyright 2026 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
<#
.SYNOPSIS
Builds and publishes the obq-gateway Docker image to GCP Artifact Registry via Cloud Build.

.DESCRIPTION
This script builds and publishes the `obq-gateway` Docker image using GCP 
Cloud Build. It avoids the need for a local Docker daemon by delegating the 
build process to Google Cloud infrastructure.

Build Context Explanation:
The `obq-gateway` service depends on the shared `common/` package located at 
the root of the monorepo. Therefore, the Docker build context must be the 
root directory (`..`), rather than the `obq-gateway` directory itself.

.PARAMETER ProjectId
GCP Project ID (default: your-gcp-project-id)

.PARAMETER Region
GCP Region (default: us-central1)

.PARAMETER Repository
Artifact Registry Repository (default: your-repo-name)

.PARAMETER ImageName
Docker Image Name (default: obq-gateway)

.PARAMETER Tag
Docker Image Tag (default: latest)

.EXAMPLE
.\publish.ps1 -p my-gcp-project -r us-central1 -repo my-docker-repo -i obq-gateway -t latest
#>
param (
    [Alias("p", "project-id")]
    [string]$ProjectId = "your-gcp-project-id",

    [Alias("r")]
    [string]$Region = "us-central1",

    [Alias("repo")]
    [string]$Repository = "your-repo-name",

    [Alias("i", "image-name")]
    [string]$ImageName = "obq-gateway",

    [Alias("t")]
    [string]$Tag = "latest"
)

$ErrorActionPreference = "Stop"

# Construct the full image path required by Artifact Registry
# We use ${} syntax to ensure the colon isn't misinterpreted as a PowerShell scope modifier
$ImagePath = "${Region}-docker.pkg.dev/${ProjectId}/${Repository}/${ImageName}:${Tag}"

Write-Host "Submitting build to GCP Cloud Build..." -ForegroundColor Cyan

# Shift directory to the root to ensure the build context includes the `common/` folder
Push-Location -Path ".."
try {
    # Submit the build to GCP Cloud Build
    # -project: Specifies the billing and execution project
    # -config: Points to the cloudbuild.yaml file located inside the obq-gateway folder
    # -substitutions: Passes the computed image path into the cloudbuild.yaml step
    gcloud builds submit --project $ProjectId --config obq-gateway/cloudbuild.yaml --substitutions "_IMAGE_PATH=$ImagePath" .
    
    # Catch non-zero exit codes from the gcloud CLI and throw an exception to halt execution
    if ($LASTEXITCODE -ne 0) {
        throw "gcloud builds submit failed with exit code $LASTEXITCODE"
    }
} finally {
    # Always return to the original directory, even if the build fails
    Pop-Location
}

Write-Host "Done! Image published to $ImagePath" -ForegroundColor Green
