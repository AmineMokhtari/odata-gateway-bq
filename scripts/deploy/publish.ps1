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
Builds and publishes Docker images via GCP Cloud Build from the repository root.

.DESCRIPTION
This script builds and publishes obq-gateway and/or obq-hub Docker images using GCP
Cloud Build. It executes directly from the root of the monorepo to ensure shared packages
like common/ are correctly incorporated into the build context.

.PARAMETER ProjectId
GCP Project ID. (default: your-gcp-project-id)

.PARAMETER Region
GCP Region. (default: us-central1)

.PARAMETER Repository
Artifact Registry Repository. (default: your-repo-name)

.PARAMETER Service
Service to publish: all, gateway (or obq-gateway), hub (or obq-hub). (default: all)

.PARAMETER ImageName
Override Docker image name.

.PARAMETER Tag
Docker Image Tag. (default: latest)

.EXAMPLE
.\scripts\deploy\publish.ps1 -p my-gcp-project -r us-central1 -repo my-docker-repo -t latest
#>
param (
    [Alias("p", "project-id")]
    [string]$ProjectId = "your-gcp-project-id",

    [Alias("r")]
    [string]$Region = "us-central1",

    [Alias("repo")]
    [string]$Repository = "your-repo-name",

    [Alias("s")]
    [ValidateSet("all", "gateway", "obq-gateway", "hub", "obq-hub")]
    [string]$Service = "all",

    [Alias("i", "image-name")]
    [string]$ImageName = "",

    [Alias("t")]
    [string]$Tag = "latest"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path "package.json")) {
    throw "This script must be executed from the repository root."
}

function Publish-Gateway {
    $targetName = if ($ImageName) { $ImageName } else { "obq-gateway" }
    $imagePath = "${Region}-docker.pkg.dev/${ProjectId}/${Repository}/${targetName}:${Tag}"
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "Publishing obq-gateway via Cloud Build..." -ForegroundColor Cyan
    Write-Host "Image: $imagePath" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan

    gcloud builds submit --project $ProjectId --config obq-gateway/cloudbuild.yaml --substitutions "_IMAGE_PATH=$imagePath" .
    if ($LASTEXITCODE -ne 0) {
        throw "gcloud builds submit failed with exit code $LASTEXITCODE"
    }
    Write-Host "Done! Image published to $imagePath" -ForegroundColor Green
}

function Publish-Hub {
    $targetName = if ($ImageName) { $ImageName } else { "obq-hub" }
    $imagePath = "${Region}-docker.pkg.dev/${ProjectId}/${Repository}/${targetName}:${Tag}"
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "Publishing obq-hub via Cloud Build..." -ForegroundColor Cyan
    Write-Host "Image: $imagePath" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan

    gcloud builds submit --project $ProjectId --config obq-hub/cloudbuild.yaml --substitutions "_IMAGE_PATH=$imagePath" .
    if ($LASTEXITCODE -ne 0) {
        throw "gcloud builds submit failed with exit code $LASTEXITCODE"
    }
    Write-Host "Done! Image published to $imagePath" -ForegroundColor Green
}

switch ($Service) {
    "all" {
        Publish-Gateway
        Write-Host ""
        Publish-Hub
    }
    { $_ -in "gateway", "obq-gateway" } {
        Publish-Gateway
    }
    { $_ -in "hub", "obq-hub" } {
        Publish-Hub
    }
}

Write-Host ""
Write-Host "Successfully published requested images!" -ForegroundColor Green

