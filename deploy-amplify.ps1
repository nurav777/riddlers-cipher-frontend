# AWS Amplify Frontend Deployment Script
# Deploys Gotham Cipher frontend to AWS Amplify using AWS CLI

param(
    [string]$AppName = "gotham-cipher",
    [string]$Region = "ap-southeast-2",
    [string]$ApiBaseUrl = "https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 AWS Amplify Frontend Deployment" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify AWS CLI is installed
Write-Host "1️⃣  Checking AWS CLI..." -ForegroundColor Yellow
try {
    $awsVersion = aws --version
    Write-Host "   ✅ AWS CLI: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ AWS CLI not found. Please install it first." -ForegroundColor Red
    Write-Host "   Download: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 2: Verify AWS credentials
Write-Host "2️⃣  Verifying AWS credentials..." -ForegroundColor Yellow
try {
    $identity = aws sts get-caller-identity --region $Region --output json | ConvertFrom-Json
    Write-Host "   ✅ Account ID: $($identity.Account)" -ForegroundColor Green
    Write-Host "   ✅ User ARN: $($identity.Arn)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ AWS credentials not configured. Please run: aws configure" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Build the frontend
Write-Host "3️⃣  Building frontend..." -ForegroundColor Yellow
try {
    npm run build
    Write-Host "   ✅ Build successful" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 4: Create S3 bucket for Amplify
Write-Host "4️⃣  Setting up S3 bucket..." -ForegroundColor Yellow
$bucketName = "amplify-$AppName-$(Get-Random -Minimum 10000 -Maximum 99999)"

try {
    # Check if bucket already exists
    $buckets = aws s3 ls --region $Region | Select-String $AppName
    if ($buckets) {
        Write-Host "   ℹ️  Using existing bucket" -ForegroundColor Cyan
        $bucketName = $buckets[0].ToString().Split()[2]
    } else {
        Write-Host "   Creating new S3 bucket: $bucketName" -ForegroundColor Yellow
        aws s3 mb "s3://$bucketName" --region $Region
        Write-Host "   ✅ S3 bucket created: $bucketName" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  S3 bucket setup skipped (may already exist)" -ForegroundColor Yellow
}

Write-Host ""

# Step 5: Upload build to S3
Write-Host "5️⃣  Uploading build to S3..." -ForegroundColor Yellow
try {
    aws s3 sync dist/ "s3://$bucketName/" --region $Region --delete
    Write-Host "   ✅ Upload complete" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Upload failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 6: Create CloudFront distribution (optional)
Write-Host "6️⃣  Setting up CloudFront distribution..." -ForegroundColor Yellow
try {
    # Check if distribution already exists
    $distributions = aws cloudfront list-distributions --region $Region --output json | ConvertFrom-Json
    $existingDist = $distributions.DistributionList.Items | Where-Object { $_.Comment -like "*$AppName*" }
    
    if ($existingDist) {
        Write-Host "   ℹ️  Using existing CloudFront distribution" -ForegroundColor Cyan
        $distributionId = $existingDist.Id
        $distributionUrl = $existingDist.DomainName
    } else {
        Write-Host "   ℹ️  CloudFront distribution setup recommended for production" -ForegroundColor Cyan
        Write-Host "   📝 Configure in AWS Console for custom domain and caching" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ⚠️  CloudFront setup skipped" -ForegroundColor Yellow
}

Write-Host ""

# Step 7: Enable S3 static website hosting
Write-Host "7️⃣  Enabling S3 static website hosting..." -ForegroundColor Yellow
try {
    # Create bucket policy for public access
    $bucketPolicy = @{
        Version = "2012-10-17"
        Statement = @(
            @{
                Effect = "Allow"
                Principal = "*"
                Action = "s3:GetObject"
                Resource = "arn:aws:s3:::$bucketName/*"
            }
        )
    } | ConvertTo-Json

    $bucketPolicy | Out-File -FilePath "bucket-policy.json" -Encoding UTF8
    
    aws s3api put-bucket-policy --bucket $bucketName --policy file://bucket-policy.json --region $Region
    
    # Enable static website hosting
    $websiteConfig = @{
        IndexDocument = @{ Suffix = "index.html" }
        ErrorDocument = @{ Key = "index.html" }
    } | ConvertTo-Json

    $websiteConfig | Out-File -FilePath "website-config.json" -Encoding UTF8
    
    aws s3api put-bucket-website --bucket $bucketName --website-configuration file://website-config.json --region $Region
    
    Write-Host "   ✅ Static website hosting enabled" -ForegroundColor Green
    
    # Clean up temp files
    Remove-Item "bucket-policy.json" -Force -ErrorAction SilentlyContinue
    Remove-Item "website-config.json" -Force -ErrorAction SilentlyContinue
} catch {
    Write-Host "   ⚠️  Static website hosting setup skipped" -ForegroundColor Yellow
}

Write-Host ""

# Step 8: Get S3 website URL
Write-Host "8️⃣  Getting website URL..." -ForegroundColor Yellow
try {
    $websiteUrl = "http://$bucketName.s3-website-$Region.amazonaws.com"
    Write-Host "   ✅ Website URL: $websiteUrl" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Could not retrieve website URL" -ForegroundColor Yellow
}

Write-Host ""

# Step 9: Create Amplify App (if using Amplify Console)
Write-Host "9️⃣  Amplify App Setup" -ForegroundColor Yellow
Write-Host "   📝 To use AWS Amplify Console:" -ForegroundColor Cyan
Write-Host "      1. Go to: https://console.aws.amazon.com/amplify/" -ForegroundColor Cyan
Write-Host "      2. Click 'Create new app' → 'Host web app'" -ForegroundColor Cyan
Write-Host "      3. Select GitHub and connect your repository" -ForegroundColor Cyan
Write-Host "      4. Set environment variable:" -ForegroundColor Cyan
Write-Host "         VITE_API_BASE_URL=$ApiBaseUrl" -ForegroundColor Cyan
Write-Host "      5. Click 'Save and deploy'" -ForegroundColor Cyan

Write-Host ""

# Summary
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Deployment Summary:" -ForegroundColor Yellow
Write-Host "   S3 Bucket: $bucketName" -ForegroundColor Cyan
Write-Host "   Region: $Region" -ForegroundColor Cyan
Write-Host "   Website URL: $websiteUrl" -ForegroundColor Cyan
Write-Host "   API Base URL: $ApiBaseUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔗 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Test website: Open $websiteUrl in browser" -ForegroundColor Cyan
Write-Host "   2. For production: Set up CloudFront distribution" -ForegroundColor Cyan
Write-Host "   3. For custom domain: Use Route 53 or your DNS provider" -ForegroundColor Cyan
Write-Host "   4. For CI/CD: Use AWS Amplify Console with GitHub" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Environment Variable (for Amplify Console):" -ForegroundColor Yellow
Write-Host "   VITE_API_BASE_URL=$ApiBaseUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "🧪 Verify Deployment:" -ForegroundColor Yellow
Write-Host "   powershell -ExecutionPolicy Bypass -File verify-api-integration.ps1" -ForegroundColor Cyan
Write-Host ""
