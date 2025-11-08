#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploys the Riddlers Cipher project to AWS Elastic Beanstalk
.DESCRIPTION
    This script automates the deployment process including:
    - Checking prerequisites
    - Initializing EB environment
    - Building the application
    - Deploying to Elastic Beanstalk
.PARAMETER AppName
    Name of the application (default: riddlers-cipher)
.PARAMETER EnvironmentName
    Name of the EB environment (default: riddlers-cipher-env)
.PARAMETER Region
    AWS region (default: ap-southeast-2)
.PARAMETER InstanceType
    EC2 instance type (default: t3.micro)
#>

param(
    [string]$AppName = "riddlers-cipher",
    [string]$EnvironmentName = "riddlers-cipher-env",
    [string]$Region = "ap-southeast-2",
    [string]$InstanceType = "t3.micro"
)

$ErrorActionPreference = "Stop"

function Write-Header {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Test-Command {
    param([string]$Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# Check prerequisites
Write-Header "Checking Prerequisites"

$prerequisites = @("node", "npm", "git", "aws", "eb")
$missingTools = @()

foreach ($tool in $prerequisites) {
    if (Test-Command $tool) {
        Write-Success "$tool is installed"
    } else {
        Write-Error "$tool is NOT installed"
        $missingTools += $tool
    }
}

if ($missingTools.Count -gt 0) {
    Write-Error "Missing tools: $($missingTools -join ', ')"
    Write-Host "Please install the missing tools and try again." -ForegroundColor Yellow
    exit 1
}

# Verify AWS credentials
Write-Header "Verifying AWS Credentials"
try {
    $identity = aws sts get-caller-identity --region $Region | ConvertFrom-Json
    Write-Success "AWS credentials verified"
    Write-Host "Account: $($identity.Account)" -ForegroundColor Gray
    Write-Host "User: $($identity.Arn)" -ForegroundColor Gray
} catch {
    Write-Error "Failed to verify AWS credentials"
    Write-Host "Run 'aws configure' to set up your credentials" -ForegroundColor Yellow
    exit 1
}

# Get project root
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

# Build frontend
Write-Header "Building Frontend"
try {
    npm run build
    Write-Success "Frontend build completed"
} catch {
    Write-Error "Frontend build failed"
    exit 1
}

# Build backend
Write-Header "Building Backend"
try {
    Set-Location backend
    npm run build
    Set-Location ..
    Write-Success "Backend build completed"
} catch {
    Write-Error "Backend build failed"
    exit 1
}

# Initialize EB if not already initialized
Write-Header "Initializing Elastic Beanstalk"
if (-not (Test-Path ".elasticbeanstalk")) {
    try {
        eb init -p "Node.js 18 running on 64bit Amazon Linux 2" $AppName --region $Region
        Write-Success "EB initialized"
    } catch {
        Write-Error "EB initialization failed"
        exit 1
    }
} else {
    Write-Success "EB already initialized"
}

# Check if environment exists
Write-Header "Checking EB Environment"
try {
    $envStatus = eb status -e $EnvironmentName 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Environment '$EnvironmentName' exists"
    } else {
        Write-Host "Environment '$EnvironmentName' does not exist. Creating..." -ForegroundColor Yellow
        eb create $EnvironmentName --instance-type $InstanceType --envvars NODE_ENV=production,PORT=8081
        Write-Success "Environment created"
    }
} catch {
    Write-Host "Environment check failed, attempting to create..." -ForegroundColor Yellow
    try {
        eb create $EnvironmentName --instance-type $InstanceType --envvars NODE_ENV=production,PORT=8081
        Write-Success "Environment created"
    } catch {
        Write-Error "Failed to create environment"
        exit 1
    }
}

# Deploy
Write-Header "Deploying to Elastic Beanstalk"
try {
    eb deploy -e $EnvironmentName
    Write-Success "Deployment completed"
} catch {
    Write-Error "Deployment failed"
    exit 1
}

# Show deployment status
Write-Header "Deployment Status"
try {
    eb status -e $EnvironmentName
    Write-Success "Check deployment status above"
} catch {
    Write-Error "Failed to retrieve deployment status"
}

# Get application URL
Write-Header "Application Information"
try {
    $envInfo = eb open -e $EnvironmentName --print-url 2>&1
    Write-Success "Application URL: $envInfo"
} catch {
    Write-Host "Run 'eb open' to open the application in your browser" -ForegroundColor Yellow
}

Write-Header "Deployment Complete!"
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Monitor logs: eb logs -e $EnvironmentName" -ForegroundColor Gray
Write-Host "2. SSH into instance: eb ssh -e $EnvironmentName" -ForegroundColor Gray
Write-Host "3. Open application: eb open -e $EnvironmentName" -ForegroundColor Gray
Write-Host "4. View environment: eb status -e $EnvironmentName" -ForegroundColor Gray
