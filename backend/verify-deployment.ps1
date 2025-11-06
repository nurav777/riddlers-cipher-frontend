# Verify API Gateway Deployment
# Check if everything is working

param(
    [string]$ApiId = "pit5nsq8w0",
    [string]$Region = "ap-southeast-2",
    [string]$StageName = "prod"
)

Write-Host "🔍 Verifying API Gateway Deployment" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Check Routes
Write-Host "`n📋 Routes:" -ForegroundColor Yellow
$routes = aws apigatewayv2 get-routes --api-id $ApiId --region $Region --output json | ConvertFrom-Json
$routeCount = $routes.Items.Count
Write-Host "  Found: $routeCount routes" -ForegroundColor Green
$routes.Items | ForEach-Object { Write-Host "    - $($_.RouteKey)" -ForegroundColor Cyan }

# Check Integrations
Write-Host "`n🔗 Integrations:" -ForegroundColor Yellow
$integrations = aws apigatewayv2 get-integrations --api-id $ApiId --region $Region --output json | ConvertFrom-Json
$intCount = $integrations.Items.Count
Write-Host "  Found: $intCount integrations" -ForegroundColor Green

# Check Stage
Write-Host "`n📦 Stage:" -ForegroundColor Yellow
$stages = aws apigatewayv2 get-stages --api-id $ApiId --region $Region --output json | ConvertFrom-Json
$stage = $stages.Items | Where-Object { $_.StageName -eq $StageName }
if ($stage) {
    Write-Host "  ✅ Stage: $($stage.StageName)" -ForegroundColor Green
    Write-Host "  Auto-Deploy: $($stage.AutoDeploy)" -ForegroundColor Green
    Write-Host "  Deployment: $($stage.DeploymentId)" -ForegroundColor Green
} else {
    Write-Host "  ❌ Stage not found" -ForegroundColor Red
}

# Check Deployments
Write-Host "`n🚀 Deployments:" -ForegroundColor Yellow
$deployments = aws apigatewayv2 get-deployments --api-id $ApiId --region $Region --output json | ConvertFrom-Json
$depCount = $deployments.Items.Count
Write-Host "  Found: $depCount deployment(s)" -ForegroundColor Green

# Check Lambda Permissions
Write-Host "`n🔐 Lambda Permissions:" -ForegroundColor Yellow
$functions = @("GetRandomRiddleFunction", "ValidateAnswerFunction", "SolveRiddleFunction", "GetPlayerProgressFunction")
foreach ($func in $functions) {
    try {
        $policy = aws lambda get-policy --function-name $func --region $Region --output json 2>$null | ConvertFrom-Json
        if ($policy) {
            Write-Host "  ✅ $func" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  $func (no policy)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ⚠️  $func (error)" -ForegroundColor Yellow
    }
}

# Test Endpoint
Write-Host "`n🧪 Testing Endpoint:" -ForegroundColor Yellow
$endpoint = "https://${ApiId}.execute-api.${Region}.amazonaws.com/${StageName}/riddles/random"
try {
    $response = curl -s -w "`n%{http_code}" $endpoint
    $statusCode = $response[-1]
    if ($statusCode -eq "200") {
        Write-Host "  ✅ Endpoint responding: $statusCode" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Endpoint status: $statusCode" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ Endpoint test failed" -ForegroundColor Red
}

Write-Host "`n====================================" -ForegroundColor Cyan
Write-Host "✅ Verification Complete" -ForegroundColor Green
