# Smart API Gateway Deployment - Checks before creating
# Only creates what's missing

param(
    [string]$ApiId = "pit5nsq8w0",
    [string]$Region = "ap-southeast-2",
    [string]$StageName = "prod"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Smart API Gateway Deployment" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Get Account ID
$AccountId = aws sts get-caller-identity --query Account --output text
Write-Host "✅ Account ID: $AccountId" -ForegroundColor Green

# Get existing integrations
Write-Host "`n📋 Checking existing integrations..." -ForegroundColor Yellow
$existingInts = aws apigatewayv2 get-integrations --api-id $ApiId --region $Region --output json | ConvertFrom-Json
$integrations = @{}

foreach ($int in $existingInts.Items) {
    if ($int.IntegrationUri -like "*GetRandomRiddleFunction*") {
        $integrations["GetRandomRiddleFunction"] = $int.IntegrationId
    } elseif ($int.IntegrationUri -like "*ValidateAnswerFunction*") {
        $integrations["ValidateAnswerFunction"] = $int.IntegrationId
    } elseif ($int.IntegrationUri -like "*SolveRiddleFunction*") {
        $integrations["SolveRiddleFunction"] = $int.IntegrationId
    } elseif ($int.IntegrationUri -like "*GetPlayerProgressFunction*") {
        $integrations["GetPlayerProgressFunction"] = $int.IntegrationId
    }
}

# Create missing integrations
$functionsNeeded = @("GetRandomRiddleFunction", "ValidateAnswerFunction", "SolveRiddleFunction", "GetPlayerProgressFunction")
foreach ($func in $functionsNeeded) {
    if (-not $integrations.ContainsKey($func)) {
        Write-Host "  Creating integration for $func..." -ForegroundColor Yellow
        $intId = aws apigatewayv2 create-integration `
            --api-id $ApiId `
            --integration-type AWS_PROXY `
            --integration-uri "arn:aws:lambda:${Region}:${AccountId}:function:${func}" `
            --payload-format-version "2.0" `
            --region $Region `
            --output text `
            --query 'IntegrationId'
        $integrations[$func] = $intId
        Write-Host "  ✅ $func : $intId" -ForegroundColor Green
    } else {
        Write-Host "  ✅ $func already exists: $($integrations[$func])" -ForegroundColor Green
    }
}

# Get existing routes
Write-Host "`n📋 Checking existing routes..." -ForegroundColor Yellow
$existingRoutes = aws apigatewayv2 get-routes --api-id $ApiId --region $Region --output json | ConvertFrom-Json
$routeKeys = @()
if ($existingRoutes.Items) {
    $routeKeys = $existingRoutes.Items | ForEach-Object { $_.RouteKey }
}

# Create missing routes
$routesNeeded = @(
    @{ key = "GET /riddles/random"; func = "GetRandomRiddleFunction" },
    @{ key = "POST /riddles/validate"; func = "ValidateAnswerFunction" },
    @{ key = "POST /riddles/solve"; func = "SolveRiddleFunction" },
    @{ key = "GET /riddles/progress"; func = "GetPlayerProgressFunction" }
)

Write-Host "`n🛣️  Creating routes..." -ForegroundColor Yellow
foreach ($route in $routesNeeded) {
    if ($route.key -notin $routeKeys) {
        Write-Host "  Creating route: $($route.key)" -ForegroundColor Yellow
        aws apigatewayv2 create-route `
            --api-id $ApiId `
            --route-key $route.key `
            --target "integrations/$($integrations[$route.func])" `
            --region $Region `
            --output null
        Write-Host "  ✅ $($route.key)" -ForegroundColor Green
    } else {
        Write-Host "  ✅ $($route.key) already exists" -ForegroundColor Green
    }
}

# Check stage
Write-Host "`n📦 Checking stage..." -ForegroundColor Yellow
$stages = aws apigatewayv2 get-stages --api-id $ApiId --region $Region --output json | ConvertFrom-Json
$stageExists = $stages.Items | Where-Object { $_.StageName -eq $StageName }

if (-not $stageExists) {
    Write-Host "  Creating stage: $StageName" -ForegroundColor Yellow
    aws apigatewayv2 create-stage `
        --api-id $ApiId `
        --stage-name $StageName `
        --auto-deploy `
        --region $Region `
        --output null
    Write-Host "  ✅ Stage created" -ForegroundColor Green
} else {
    Write-Host "  ✅ Stage already exists" -ForegroundColor Green
}

# Create deployment
Write-Host "`n🚀 Creating deployment..." -ForegroundColor Yellow
$DeploymentId = aws apigatewayv2 create-deployment `
    --api-id $ApiId `
    --stage-name $StageName `
    --region $Region `
    --output text `
    --query 'DeploymentId'
Write-Host "  ✅ Deployment: $DeploymentId" -ForegroundColor Green

# Grant Lambda permissions
Write-Host "`n🔐 Granting Lambda permissions..." -ForegroundColor Yellow
foreach ($func in $functionsNeeded) {
    aws lambda remove-permission `
        --function-name $func `
        --statement-id apigateway-access `
        --region $Region 2>$null
    
    aws lambda add-permission `
        --function-name $func `
        --statement-id apigateway-access `
        --action lambda:InvokeFunction `
        --principal apigateway.amazonaws.com `
        --source-arn "arn:aws:execute-api:${Region}:${AccountId}:${ApiId}/*/*" `
        --region $Region `
        --output null
    Write-Host "  ✅ $func" -ForegroundColor Green
}

# Summary
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host "`n📍 API Endpoint:" -ForegroundColor Yellow
Write-Host "https://${ApiId}.execute-api.${Region}.amazonaws.com/${StageName}" -ForegroundColor Cyan
Write-Host "`n🧪 Test:" -ForegroundColor Yellow
Write-Host "curl https://${ApiId}.execute-api.${Region}.amazonaws.com/${StageName}/riddles/random" -ForegroundColor Cyan
Write-Host "`n📊 Verify:" -ForegroundColor Yellow
Write-Host "powershell -ExecutionPolicy Bypass -File verify-deployment.ps1" -ForegroundColor Cyan
Write-Host "`n🧪 Test All:" -ForegroundColor Yellow
Write-Host "powershell -ExecutionPolicy Bypass -File test-endpoints.ps1" -ForegroundColor Cyan
