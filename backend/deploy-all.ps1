# Complete API Gateway Deployment - All-in-One
# PowerShell script - No dependencies, pure AWS CLI

param(
    [string]$ApiId = "pit5nsq8w0",
    [string]$Region = "ap-southeast-2",
    [string]$StageName = "prod"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Complete API Gateway Deployment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Get Account ID
$AccountId = aws sts get-caller-identity --query Account --output text
Write-Host "✅ Account ID: $AccountId" -ForegroundColor Green

# Create Integrations
Write-Host "`n🔗 Creating Integrations..." -ForegroundColor Yellow

$integrations = @{
    "GetRandomRiddleFunction" = ""
    "ValidateAnswerFunction" = ""
    "SolveRiddleFunction" = ""
    "GetPlayerProgressFunction" = ""
}

foreach ($func in $integrations.Keys) {
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
}

# Create Routes
Write-Host "`n🛣️  Creating Routes..." -ForegroundColor Yellow

$routes = @(
    @{ key = "GET /riddles/random"; func = "GetRandomRiddleFunction" },
    @{ key = "POST /riddles/validate"; func = "ValidateAnswerFunction" },
    @{ key = "POST /riddles/solve"; func = "SolveRiddleFunction" },
    @{ key = "GET /riddles/progress"; func = "GetPlayerProgressFunction" }
)

foreach ($route in $routes) {
    aws apigatewayv2 create-route `
        --api-id $ApiId `
        --route-key $route.key `
        --target "integrations/$($integrations[$route.func])" `
        --region $Region `
        --output null
    Write-Host "  ✅ $($route.key)" -ForegroundColor Green
}

# Create Stage
Write-Host "`n📦 Creating Stage..." -ForegroundColor Yellow
aws apigatewayv2 create-stage `
    --api-id $ApiId `
    --stage-name $StageName `
    --auto-deploy `
    --region $Region `
    --output null 2>$null
Write-Host "  ✅ Stage: $StageName" -ForegroundColor Green

# Create Deployment
Write-Host "`n🚀 Creating Deployment..." -ForegroundColor Yellow
$DeploymentId = aws apigatewayv2 create-deployment `
    --api-id $ApiId `
    --stage-name $StageName `
    --region $Region `
    --output text `
    --query 'DeploymentId'
Write-Host "  ✅ Deployment: $DeploymentId" -ForegroundColor Green

# Grant Lambda Permissions
Write-Host "`n🔐 Granting Lambda Permissions..." -ForegroundColor Yellow
foreach ($func in $integrations.Keys) {
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
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "`n📍 API Endpoint:" -ForegroundColor Yellow
Write-Host "https://${ApiId}.execute-api.${Region}.amazonaws.com/${StageName}" -ForegroundColor Cyan
Write-Host "`n🧪 Test:" -ForegroundColor Yellow
Write-Host "curl https://${ApiId}.execute-api.${Region}.amazonaws.com/${StageName}/riddles/random" -ForegroundColor Cyan
