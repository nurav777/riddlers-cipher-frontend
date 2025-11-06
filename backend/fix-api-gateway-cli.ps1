# Complete API Gateway 404 Fix - Pure AWS CLI (PowerShell)
# This script uses only AWS CLI commands to fix all 404 errors
# No bash dependencies required - works on Windows

param(
    [string]$ApiId = "pit5nsq8w0",
    [string]$Region = "ap-southeast-2",
    [string]$StageName = "prod"
)

$ErrorActionPreference = "Stop"

Write-Host "🔧 Fixing API Gateway 404 Errors (AWS CLI Only)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "API ID: $ApiId"
Write-Host "Region: $Region"
Write-Host "Stage: $StageName"
Write-Host ""

# Get AWS Account ID
try {
    Write-Host "📋 Getting AWS Account ID..." -ForegroundColor Yellow
    $AccountId = aws sts get-caller-identity --query Account --output text
    Write-Host "✅ Account ID: $AccountId" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to get Account ID. Check AWS credentials." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 1: Check if routes already exist
Write-Host "📋 Step 1: Checking existing routes..." -ForegroundColor Yellow
try {
    $RoutesJson = aws apigatewayv2 get-routes --api-id $ApiId --region $Region --output json 2>$null | ConvertFrom-Json
    $ExistingRoutes = $RoutesJson.Items.Count
    Write-Host "✅ Found $ExistingRoutes existing route(s)" -ForegroundColor Green
} catch {
    Write-Host "⚠️  No routes found" -ForegroundColor Yellow
    $ExistingRoutes = 0
}
Write-Host ""

# Step 2: Create integrations if routes don't exist
if ($ExistingRoutes -eq 0) {
    Write-Host "🔗 Step 2: Creating Lambda integrations..." -ForegroundColor Yellow
    
    # Get Random Riddle Integration
    Write-Host "  Creating GetRandomRiddleFunction integration..." -ForegroundColor Gray
    $RandomRiddleInt = aws apigatewayv2 create-integration `
        --api-id $ApiId `
        --integration-type AWS_PROXY `
        --integration-uri "arn:aws:lambda:${Region}:${AccountId}:function:GetRandomRiddleFunction" `
        --payload-format-version "2.0" `
        --region $Region `
        --output text `
        --query 'IntegrationId'
    Write-Host "  ✅ Integration ID: $RandomRiddleInt" -ForegroundColor Green
    
    # Validate Answer Integration
    Write-Host "  Creating ValidateAnswerFunction integration..." -ForegroundColor Gray
    $ValidateInt = aws apigatewayv2 create-integration `
        --api-id $ApiId `
        --integration-type AWS_PROXY `
        --integration-uri "arn:aws:lambda:${Region}:${AccountId}:function:ValidateAnswerFunction" `
        --payload-format-version "2.0" `
        --region $Region `
        --output text `
        --query 'IntegrationId'
    Write-Host "  ✅ Integration ID: $ValidateInt" -ForegroundColor Green
    
    # Solve Riddle Integration
    Write-Host "  Creating SolveRiddleFunction integration..." -ForegroundColor Gray
    $SolveInt = aws apigatewayv2 create-integration `
        --api-id $ApiId `
        --integration-type AWS_PROXY `
        --integration-uri "arn:aws:lambda:${Region}:${AccountId}:function:SolveRiddleFunction" `
        --payload-format-version "2.0" `
        --region $Region `
        --output text `
        --query 'IntegrationId'
    Write-Host "  ✅ Integration ID: $SolveInt" -ForegroundColor Green
    
    # Get Player Progress Integration
    Write-Host "  Creating GetPlayerProgressFunction integration..." -ForegroundColor Gray
    $ProgressInt = aws apigatewayv2 create-integration `
        --api-id $ApiId `
        --integration-type AWS_PROXY `
        --integration-uri "arn:aws:lambda:${Region}:${AccountId}:function:GetPlayerProgressFunction" `
        --payload-format-version "2.0" `
        --region $Region `
        --output text `
        --query 'IntegrationId'
    Write-Host "  ✅ Integration ID: $ProgressInt" -ForegroundColor Green
    Write-Host ""
    
    # Step 3: Create routes
    Write-Host "🛣️  Step 3: Creating API routes..." -ForegroundColor Yellow
    
    Write-Host "  Creating GET /riddles/random route..." -ForegroundColor Gray
    aws apigatewayv2 create-route `
        --api-id $ApiId `
        --route-key "GET /riddles/random" `
        --target "integrations/$RandomRiddleInt" `
        --region $Region `
        --output null
    Write-Host "  ✅ Route created" -ForegroundColor Green
    
    Write-Host "  Creating POST /riddles/validate route..." -ForegroundColor Gray
    aws apigatewayv2 create-route `
        --api-id $ApiId `
        --route-key "POST /riddles/validate" `
        --target "integrations/$ValidateInt" `
        --region $Region `
        --output null
    Write-Host "  ✅ Route created" -ForegroundColor Green
    
    Write-Host "  Creating POST /riddles/solve route..." -ForegroundColor Gray
    aws apigatewayv2 create-route `
        --api-id $ApiId `
        --route-key "POST /riddles/solve" `
        --target "integrations/$SolveInt" `
        --region $Region `
        --output null
    Write-Host "  ✅ Route created" -ForegroundColor Green
    
    Write-Host "  Creating GET /riddles/progress route..." -ForegroundColor Gray
    aws apigatewayv2 create-route `
        --api-id $ApiId `
        --route-key "GET /riddles/progress" `
        --target "integrations/$ProgressInt" `
        --region $Region `
        --output null
    Write-Host "  ✅ Route created" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "✅ Routes already exist, skipping route creation" -ForegroundColor Green
    Write-Host ""
}

# Step 4: Check if stage exists
Write-Host "📋 Step 4: Checking stage..." -ForegroundColor Yellow
try {
    $StageJson = aws apigatewayv2 get-stages --api-id $ApiId --region $Region --output json 2>$null | ConvertFrom-Json
    $StageExists = $StageJson.Items | Where-Object { $_.StageName -eq $StageName }
    
    if ($StageExists) {
        Write-Host "✅ Stage '$StageName' already exists" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Stage '$StageName' not found. Creating..." -ForegroundColor Yellow
        aws apigatewayv2 create-stage `
            --api-id $ApiId `
            --stage-name $StageName `
            --auto-deploy `
            --region $Region `
            --output null
        Write-Host "✅ Stage created with auto-deploy enabled" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Stage not found. Creating..." -ForegroundColor Yellow
    aws apigatewayv2 create-stage `
        --api-id $ApiId `
        --stage-name $StageName `
        --auto-deploy `
        --region $Region `
        --output null
    Write-Host "✅ Stage created with auto-deploy enabled" -ForegroundColor Green
}
Write-Host ""

# Step 5: Create deployment
Write-Host "📦 Step 5: Creating deployment..." -ForegroundColor Yellow
$DeploymentJson = aws apigatewayv2 create-deployment `
    --api-id $ApiId `
    --stage-name $StageName `
    --region $Region `
    --output json | ConvertFrom-Json
$DeploymentId = $DeploymentJson.DeploymentId
Write-Host "✅ Deployment created: $DeploymentId" -ForegroundColor Green
Write-Host ""

# Step 6: Grant Lambda permissions
Write-Host "🔐 Step 6: Granting Lambda invoke permissions..." -ForegroundColor Yellow

$LambdaFunctions = @(
    "GetRandomRiddleFunction",
    "ValidateAnswerFunction",
    "SolveRiddleFunction",
    "GetPlayerProgressFunction"
)

foreach ($func in $LambdaFunctions) {
    Write-Host "  Processing $func..." -ForegroundColor Gray
    
    # Remove existing permission if it exists
    try {
        aws lambda remove-permission `
            --function-name $func `
            --statement-id apigateway-access `
            --region $Region `
            --output null 2>$null
    } catch {
        # Permission doesn't exist yet, that's fine
    }
    
    # Add new permission
    aws lambda add-permission `
        --function-name $func `
        --statement-id apigateway-access `
        --action lambda:InvokeFunction `
        --principal apigateway.amazonaws.com `
        --source-arn "arn:aws:execute-api:${Region}:${AccountId}:${ApiId}/*/*" `
        --region $Region `
        --output null
    
    Write-Host "  ✅ Permission granted" -ForegroundColor Green
}
Write-Host ""

# Step 7: Display results
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✅ API Gateway Fixed Successfully!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📍 API Endpoint:" -ForegroundColor Yellow
Write-Host "   https://${ApiId}.execute-api.${Region}.amazonaws.com/${StageName}"
Write-Host ""

Write-Host "🧪 Test with cURL:" -ForegroundColor Yellow
Write-Host "   curl https://${ApiId}.execute-api.${Region}.amazonaws.com/${StageName}/riddles/random"
Write-Host ""

Write-Host "📊 Verify with AWS CLI:" -ForegroundColor Yellow
Write-Host "   aws apigatewayv2 get-routes --api-id $ApiId --region $Region"
Write-Host "   aws apigatewayv2 get-integrations --api-id $ApiId --region $Region"
Write-Host "   aws apigatewayv2 get-stages --api-id $ApiId --region $Region"
Write-Host ""

Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Test the endpoint with curl"
Write-Host "2. Check CloudWatch logs: aws logs tail /aws/lambda --follow --region $Region"
Write-Host "3. Update frontend with API endpoint"
Write-Host ""
