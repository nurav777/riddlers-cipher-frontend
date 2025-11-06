# Simple API Gateway Deployment - Direct AWS CLI calls

$ApiId = "pit5nsq8w0"
$Region = "ap-southeast-2"
$StageName = "prod"

Write-Host "🚀 Deploying API Gateway" -ForegroundColor Cyan

# Get Account ID
$AccountId = aws sts get-caller-identity --query Account --output text
Write-Host "Account: $AccountId" -ForegroundColor Green

# Create integrations
Write-Host "`nCreating integrations..." -ForegroundColor Yellow
$int1 = aws apigatewayv2 create-integration --api-id $ApiId --integration-type AWS_PROXY --integration-uri "arn:aws:lambda:${Region}:${AccountId}:function:GetRandomRiddleFunction" --payload-format-version "2.0" --region $Region --query 'IntegrationId' --output text
$int2 = aws apigatewayv2 create-integration --api-id $ApiId --integration-type AWS_PROXY --integration-uri "arn:aws:lambda:${Region}:${AccountId}:function:ValidateAnswerFunction" --payload-format-version "2.0" --region $Region --query 'IntegrationId' --output text
$int3 = aws apigatewayv2 create-integration --api-id $ApiId --integration-type AWS_PROXY --integration-uri "arn:aws:lambda:${Region}:${AccountId}:function:SolveRiddleFunction" --payload-format-version "2.0" --region $Region --query 'IntegrationId' --output text
$int4 = aws apigatewayv2 create-integration --api-id $ApiId --integration-type AWS_PROXY --integration-uri "arn:aws:lambda:${Region}:${AccountId}:function:GetPlayerProgressFunction" --payload-format-version "2.0" --region $Region --query 'IntegrationId' --output text

Write-Host "✅ Integrations created" -ForegroundColor Green

# Create routes
Write-Host "`nCreating routes..." -ForegroundColor Yellow
aws apigatewayv2 create-route --api-id $ApiId --route-key "GET /riddles/random" --target "integrations/$int1" --region $Region 2>$null
aws apigatewayv2 create-route --api-id $ApiId --route-key "POST /riddles/validate" --target "integrations/$int2" --region $Region 2>$null
aws apigatewayv2 create-route --api-id $ApiId --route-key "POST /riddles/solve" --target "integrations/$int3" --region $Region 2>$null
aws apigatewayv2 create-route --api-id $ApiId --route-key "GET /riddles/progress" --target "integrations/$int4" --region $Region 2>$null
Write-Host "✅ Routes created" -ForegroundColor Green

# Create stage
Write-Host "`nCreating stage..." -ForegroundColor Yellow
aws apigatewayv2 create-stage --api-id $ApiId --stage-name $StageName --auto-deploy --region $Region 2>$null
Write-Host "✅ Stage created" -ForegroundColor Green

# Create deployment
Write-Host "`nCreating deployment..." -ForegroundColor Yellow
aws apigatewayv2 create-deployment --api-id $ApiId --stage-name $StageName --region $Region
Write-Host "✅ Deployment created" -ForegroundColor Green

# Grant permissions
Write-Host "`nGranting permissions..." -ForegroundColor Yellow
foreach ($func in @("GetRandomRiddleFunction", "ValidateAnswerFunction", "SolveRiddleFunction", "GetPlayerProgressFunction")) {
    aws lambda remove-permission --function-name $func --statement-id apigateway-access --region $Region 2>$null
    aws lambda add-permission --function-name $func --statement-id apigateway-access --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:${Region}:${AccountId}:${ApiId}/*/*" --region $Region 2>$null
}
Write-Host "✅ Permissions granted" -ForegroundColor Green

Write-Host "`n✅ Done!" -ForegroundColor Green
Write-Host "Endpoint: https://${ApiId}.execute-api.${Region}.amazonaws.com/${StageName}" -ForegroundColor Cyan
