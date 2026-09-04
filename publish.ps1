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
Master Publish Script to build and publish all Docker images via GCP Cloud Build.

.DESCRIPTION
This script orchestrates the build and publish process for all microservices 
in the OData Gateway project (obq-gateway and obq-hub).

It iterates through the service directories and calls their respective 
publish.ps1 scripts, passing along standard configurations like GCP Project ID, 
Artifact Registry Region, Repository Name, and Image Tag.

.PARAMETER ProjectId
The Google Cloud Project ID where the Cloud Build will run and images will be stored. (default: your-gcp-project-id)

.PARAMETER Region
The GCP Region where the Artifact Registry repository is located. (default: us-central1)

.PARAMETER Repository
The name of the Artifact Registry repository. (default: your-repo-name)

.PARAMETER Tag
The tag to apply to the Docker images (e.g., v1.0.0, latest). (default: latest)

.EXAMPLE
.\publish.ps1 -p my-gcp-project -r europe-west1 -repo my-docker-repo -t v1.0
#>
param (
    [Alias("p", "project-id")]
    [string]$ProjectId = "your-gcp-project-id",

    [Alias("r")]
    [string]$Region = "us-central1",

    [Alias("repo")]
    [string]$Repository = "your-repo-name",

    [Alias("t")]
    [string]$Tag = "latest"
)

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Publishing obq-gateway..." -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
# Temporarily shift context to obq-gateway and run its dedicated script
Push-Location -Path "obq-gateway"
try {
    .\publish.ps1 -ProjectId $ProjectId -Region $Region -Repository $Repository -Tag $Tag
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Publishing obq-hub..." -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
# Temporarily shift context to obq-hub and run its dedicated script
Push-Location -Path "obq-hub"
try {
    .\publish.ps1 -ProjectId $ProjectId -Region $Region -Repository $Repository -Tag $Tag
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "Successfully published both obq-gateway and obq-hub!" -ForegroundColor Green
