# Fix API Gateway 404 Errors (PowerShell)
# This script fixes common issues causing 404 errors in HTTP API Gateway

param(
    [string]$ApiId = "pit5nsq8w0",
    [string]$Region = "ap-southeast-2",
    [string]$StageName = "prod"
)

Write-Host "🔧 Fixing API Gateway 404 Errors" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "API ID: $ApiId"
Write-Host "Region: $Region"
Write-Host "Stage: $StageName"
Write-Host ""

# Get AWS Account ID
try {
    $AccountId = aws sts get-caller-identity --query Account --output text
    Write-Host "✅ AWS Account ID: $AccountId" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to get AWS Account ID. Check AWS credentials." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 1: Check if routes exist
Write-Host "📋 Step 1: Checking existing routes..." -ForegroundColor Yellow
try {
    $Routes = aws apigatewayv2 get-routes --api-id $ApiId --region $Region --query 'Items[*].RouteKey' --output text 2>$null
} catch {
    $Routes = ""
}

if ([string]::IsNullOrEmpty($Routes)) {
    Write-Host "⚠️  No routes found. Creating routes..." -ForegroundColor Yellow
    
    # Create integrations first
    Write-Host "🔗 Creating Lambda integrations..." -ForegroundColor Yellow
    
    # Get Random Riddle Integration
    $RandomRiddleInt = aws apigatewayv2 create-integration `
        --api-id $ApiId `
        --integration-type AWS_PROXY `
        --integration-uri "arn:aws:lambda:${Region}:${AccountId}:function:GetRandomRiddleFunction" `
        --payload-format-version "2.0" `
        --region $Region `
        --query 'IntegrationId' `
        --output text
    Write-Host "✅ Random Riddle Integration: $RandomRiddleInt" -ForegroundColor Green
    
    # Validate Answer Integration
    $ValidateInt = aws apigatewayv2 create-integration `
        --api-id $ApiId `
        --integration-type AWS_PROXY `
        --integration-uri "arn:aws:lambda:${Region}:${AccountId}:function:ValidateAnswerFunction" `
        --payload-format-version "2.0" `
        --region $Region `
        --query 'IntegrationId' `
        --output text
    Write-Host "✅ Validate Answer Integration: $ValidateInt" -ForegroundColor Green
    
    # Solve Riddle Integration
    $SolveInt = aws apigatewayv2 create-integration `
        --api-id $ApiId `
        --integration-type AWS_PROXY `
        --integration-uri "arn:aws:lambda:${Region}:${AccountId}:function:SolveRiddleFunction" `
        --payload-format-version "2.0" `
        --region $Region `
        --query 'IntegrationId' `
        --output text
    Write-Host "✅ Solve Riddle Integration: $SolveInt" -ForegroundColor Green
    
    # Get Player Progress Integration
    $ProgressInt = aws apigatewayv2 create-integration `
        --api-id $ApiId `
        --integration-type AWS_PROXY `
        --integration-uri "arn:aws:lambda:${Region}:${AccountId}:function:GetPlayerProgressFunction" `
        --payload-format-version "2.0" `
        --region $Region `
        --query 'IntegrationId' `
        --output text
    Write-Host "✅ Get Player Progress Integration: $ProgressInt" -ForegroundColor Green
    Write-Host ""
    
    # Create routes
    Write-Host "🛣️  Creating routes..." -ForegroundColor Yellow
    
    aws apigatewayv2 create-route `
        --api-id $ApiId `
        --route-key "GET /riddles/random" `
        --target "integrations/$RandomRiddleInt" `
        --region $Region | Out-Null
    Write-Host "✅ Route created: GET /riddles/random" -ForegroundColor Green
    
    aws apigatewayv2 create-route `
        --api-id $ApiId `
        --route-key "POST /riddles/validate" `
        --target "integrations/$ValidateInt" `
        --region $Region | Out-Null
    Write-Host "✅ Route created: POST /riddles/validate" -ForegroundColor Green
    
    aws apigatewayv2 create-route `
        --api-id $ApiId `
        --route-key "POST /riddles/solve" `
        --target "integrations/$SolveInt" `
        --region $Region | Out-Null
    Write-Host "✅ Route created: POST /riddles/solve" -ForegroundColor Green
    
    aws apigatewayv2 create-route `
        --api-id $ApiId `
        --route-key "GET /riddles/progress" `
        --target "integrations/$ProgressInt" `
        --region $Region | Out-Null
    Write-Host "✅ Route created: GET /riddles/progress" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "✅ Routes already exist: $Routes" -ForegroundColor Green
    Write-Host ""
}

# Step 2: Check if stage exists
Write-Host "📋 Step 2: Checking stages..." -ForegroundColor Yellow
try {
    $StageExists = aws apigatewayv2 get-stages --api-id $ApiId --region $Region --query "Items[?StageName=='$StageName'].StageName" --output text 2>$null
} catch {
    $StageExists = ""
}

if ([string]::IsNullOrEmpty($StageExists)) {
    Write-Host "⚠️  Stage '$StageName' not found. Creating stage..." -ForegroundColor Yellow
    
    aws apigatewayv2 create-stage `
        --api-id $ApiId `
        --stage-name $StageName `
        --auto-deploy `
        --region $Region | Out-Null
    
    Write-Host "✅ Stage created: $StageName (with auto-deploy enabled)" -ForegroundColor Green
} else {
    Write-Host "✅ Stage already exists: $StageName" -ForegroundColor Green
}
Write-Host ""

# Step 3: Create deployment
Write-Host "📋 Step 3: Creating deployment..." -ForegroundColor Yellow
$Deployment = aws apigatewayv2 create-deployment `
    --api-id $ApiId `
    --stage-name $StageName `
    --region $Region `
    --query 'DeploymentId' `
    --output text

Write-Host "✅ Deployment created: $Deployment" -ForegroundColor Green
Write-Host ""

# Step 4: Grant Lambda permissions
Write-Host "📋 Step 4: Granting Lambda invoke permissions..." -ForegroundColor Yellow

$LambdaFunctions = @(
    "GetRandomRiddleFunction",
    "ValidateAnswerFunction",
    "SolveRiddleFunction",
    "GetPlayerProgressFunction"
)

foreach ($func in $LambdaFunctions) {
    # Remove existing permission if it exists
    aws lambda remove-permission `
        --function-name $func `
        --statement-id apigateway-access `
        --region $Region 2>$null
    
    # Add new permission
    aws lambda add-permission `
        --function-name $func `
        --statement-id apigateway-access `
        --action lambda:InvokeFunction `
        --principal apigateway.amazonaws.com `
        --source-arn "arn:aws:execute-api:${Region}:${AccountId}:${ApiId}/*/*" `
        --region $Region | Out-Null
    
    Write-Host "✅ Permission granted: $func" -ForegroundColor Green
}
Write-Host ""

# Step 5: Display API endpoint
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "✅ API Gateway Fixed!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📍 API Endpoint:" -ForegroundColor Yellow
Write-Host "   https://${ApiId}.execute-api.${Region}.amazonaws.com/${StageName}"
Write-Host ""

Write-Host "🧪 Test endpoints:" -ForegroundColor Yellow
Write-Host "   curl https://${ApiId}.execute-api.${Region}.amazonaws.com/${StageName}/riddles/random"
Write-Host "   curl -X POST https://${ApiId}.execute-api.${Region}.amazonaws.com/${StageName}/riddles/validate -H 'Content-Type: application/json' -d '{`"riddleId`":`"test`",`"answer`":`"test`"}'"
Write-Host ""

Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Test the endpoints using the commands above"
Write-Host "2. If still getting 404, check Lambda function permissions"
Write-Host "3. Check CloudWatch logs for Lambda execution errors"
Write-Host ""
