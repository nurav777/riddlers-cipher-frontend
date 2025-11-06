# AWS CLI Commands - Complete Reference

All commands to fix your API Gateway 404 errors using AWS CLI only.

**Configuration:**
```powershell
$ApiId = "pit5nsq8w0"
$Region = "ap-southeast-2"
$StageName = "prod"
$AccountId = aws sts get-caller-identity --query Account --output text
```

---

## 1. Get AWS Account ID

```powershell
aws sts get-caller-identity --query Account --output text
```

**Output:** Your AWS account ID (12 digits)

---

## 2. Check Current Routes

```powershell
aws apigatewayv2 get-routes --api-id pit5nsq8w0 --region ap-southeast-2
```

**Output:** List of all routes (should be empty initially)

---

## 3. Create Integrations

### 3.1 GetRandomRiddleFunction Integration

```powershell
$RandomRiddleInt = aws apigatewayv2 create-integration `
    --api-id pit5nsq8w0 `
    --integration-type AWS_PROXY `
    --integration-uri "arn:aws:lambda:ap-southeast-2:$AccountId:function:GetRandomRiddleFunction" `
    --payload-format-version "2.0" `
    --region ap-southeast-2 `
    --output text `
    --query 'IntegrationId'

Write-Host "Random Riddle Integration: $RandomRiddleInt"
```

### 3.2 ValidateAnswerFunction Integration

```powershell
$ValidateInt = aws apigatewayv2 create-integration `
    --api-id pit5nsq8w0 `
    --integration-type AWS_PROXY `
    --integration-uri "arn:aws:lambda:ap-southeast-2:$AccountId:function:ValidateAnswerFunction" `
    --payload-format-version "2.0" `
    --region ap-southeast-2 `
    --output text `
    --query 'IntegrationId'

Write-Host "Validate Answer Integration: $ValidateInt"
```

### 3.3 SolveRiddleFunction Integration

```powershell
$SolveInt = aws apigatewayv2 create-integration `
    --api-id pit5nsq8w0 `
    --integration-type AWS_PROXY `
    --integration-uri "arn:aws:lambda:ap-southeast-2:$AccountId:function:SolveRiddleFunction" `
    --payload-format-version "2.0" `
    --region ap-southeast-2 `
    --output text `
    --query 'IntegrationId'

Write-Host "Solve Riddle Integration: $SolveInt"
```

### 3.4 GetPlayerProgressFunction Integration

```powershell
$ProgressInt = aws apigatewayv2 create-integration `
    --api-id pit5nsq8w0 `
    --integration-type AWS_PROXY `
    --integration-uri "arn:aws:lambda:ap-southeast-2:$AccountId:function:GetPlayerProgressFunction" `
    --payload-format-version "2.0" `
    --region ap-southeast-2 `
    --output text `
    --query 'IntegrationId'

Write-Host "Player Progress Integration: $ProgressInt"
```

---

## 4. Create Routes

### 4.1 GET /riddles/random

```powershell
aws apigatewayv2 create-route `
    --api-id pit5nsq8w0 `
    --route-key "GET /riddles/random" `
    --target "integrations/$RandomRiddleInt" `
    --region ap-southeast-2
```

### 4.2 POST /riddles/validate

```powershell
aws apigatewayv2 create-route `
    --api-id pit5nsq8w0 `
    --route-key "POST /riddles/validate" `
    --target "integrations/$ValidateInt" `
    --region ap-southeast-2
```

### 4.3 POST /riddles/solve

```powershell
aws apigatewayv2 create-route `
    --api-id pit5nsq8w0 `
    --route-key "POST /riddles/solve" `
    --target "integrations/$SolveInt" `
    --region ap-southeast-2
```

### 4.4 GET /riddles/progress

```powershell
aws apigatewayv2 create-route `
    --api-id pit5nsq8w0 `
    --route-key "GET /riddles/progress" `
    --target "integrations/$ProgressInt" `
    --region ap-southeast-2
```

---

## 5. Create Stage

```powershell
aws apigatewayv2 create-stage `
    --api-id pit5nsq8w0 `
    --stage-name prod `
    --auto-deploy `
    --region ap-southeast-2
```

---

## 6. Create Deployment

```powershell
aws apigatewayv2 create-deployment `
    --api-id pit5nsq8w0 `
    --stage-name prod `
    --region ap-southeast-2
```

---

## 7. Grant Lambda Permissions

### 7.1 GetRandomRiddleFunction

```powershell
aws lambda add-permission `
    --function-name GetRandomRiddleFunction `
    --statement-id apigateway-access `
    --action lambda:InvokeFunction `
    --principal apigateway.amazonaws.com `
    --source-arn "arn:aws:execute-api:ap-southeast-2:$AccountId:pit5nsq8w0/*/*" `
    --region ap-southeast-2
```

### 7.2 ValidateAnswerFunction

```powershell
aws lambda add-permission `
    --function-name ValidateAnswerFunction `
    --statement-id apigateway-access `
    --action lambda:InvokeFunction `
    --principal apigateway.amazonaws.com `
    --source-arn "arn:aws:execute-api:ap-southeast-2:$AccountId:pit5nsq8w0/*/*" `
    --region ap-southeast-2
```

### 7.3 SolveRiddleFunction

```powershell
aws lambda add-permission `
    --function-name SolveRiddleFunction `
    --statement-id apigateway-access `
    --action lambda:InvokeFunction `
    --principal apigateway.amazonaws.com `
    --source-arn "arn:aws:execute-api:ap-southeast-2:$AccountId:pit5nsq8w0/*/*" `
    --region ap-southeast-2
```

### 7.4 GetPlayerProgressFunction

```powershell
aws lambda add-permission `
    --function-name GetPlayerProgressFunction `
    --statement-id apigateway-access `
    --action lambda:InvokeFunction `
    --principal apigateway.amazonaws.com `
    --source-arn "arn:aws:execute-api:ap-southeast-2:$AccountId:pit5nsq8w0/*/*" `
    --region ap-southeast-2
```

---

## Verification Commands

### Check Routes

```powershell
aws apigatewayv2 get-routes --api-id pit5nsq8w0 --region ap-southeast-2
```

**Pretty print:**
```powershell
aws apigatewayv2 get-routes --api-id pit5nsq8w0 --region ap-southeast-2 --output json | ConvertFrom-Json | ConvertTo-Json
```

### Check Integrations

```powershell
aws apigatewayv2 get-integrations --api-id pit5nsq8w0 --region ap-southeast-2
```

### Check Stages

```powershell
aws apigatewayv2 get-stages --api-id pit5nsq8w0 --region ap-southeast-2
```

### Check Deployments

```powershell
aws apigatewayv2 get-deployments --api-id pit5nsq8w0 --region ap-southeast-2
```

### Check Lambda Permissions

```powershell
aws lambda get-policy --function-name GetRandomRiddleFunction --region ap-southeast-2
```

---

## Testing Commands

### Test Endpoint with curl

```powershell
curl https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod/riddles/random
```

### Test with Invoke-WebRequest (PowerShell)

```powershell
Invoke-WebRequest -Uri "https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod/riddles/random" -Method GET
```

### Test POST Endpoint

```powershell
curl -X POST https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod/riddles/validate `
  -H "Content-Type: application/json" `
  -d '{"riddleId":"test","answer":"ARKHAM"}'
```

### Test with Invoke-WebRequest (PowerShell)

```powershell
$body = @{
    riddleId = "test"
    answer = "ARKHAM"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod/riddles/validate" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body
```

---

## CloudWatch Logs Commands

### View Recent Logs

```powershell
aws logs tail /aws/lambda --follow --region ap-southeast-2
```

### View Specific Function Logs

```powershell
aws logs tail /aws/lambda/GetRandomRiddleFunction --follow --region ap-southeast-2
```

### Get Log Streams

```powershell
aws logs describe-log-streams --log-group-name /aws/lambda/GetRandomRiddleFunction --region ap-southeast-2
```

### Get Log Events

```powershell
aws logs get-log-events `
    --log-group-name /aws/lambda/GetRandomRiddleFunction `
    --log-stream-name "2024/01/15/[$LATEST]abc123" `
    --region ap-southeast-2
```

---

## Complete Automated Script

Run this to do everything:

```powershell
# Set variables
$ApiId = "pit5nsq8w0"
$Region = "ap-southeast-2"
$StageName = "prod"

# Get Account ID
$AccountId = aws sts get-caller-identity --query Account --output text
Write-Host "Account ID: $AccountId"

# Create integrations
Write-Host "Creating integrations..."
$RandomRiddleInt = aws apigatewayv2 create-integration --api-id $ApiId --integration-type AWS_PROXY --integration-uri "arn:aws:lambda:${Region}:${AccountId}:function:GetRandomRiddleFunction" --payload-format-version "2.0" --region $Region --output text --query 'IntegrationId'
$ValidateInt = aws apigatewayv2 create-integration --api-id $ApiId --integration-type AWS_PROXY --integration-uri "arn:aws:lambda:${Region}:${AccountId}:function:ValidateAnswerFunction" --payload-format-version "2.0" --region $Region --output text --query 'IntegrationId'
$SolveInt = aws apigatewayv2 create-integration --api-id $ApiId --integration-type AWS_PROXY --integration-uri "arn:aws:lambda:${Region}:${AccountId}:function:SolveRiddleFunction" --payload-format-version "2.0" --region $Region --output text --query 'IntegrationId'
$ProgressInt = aws apigatewayv2 create-integration --api-id $ApiId --integration-type AWS_PROXY --integration-uri "arn:aws:lambda:${Region}:${AccountId}:function:GetPlayerProgressFunction" --payload-format-version "2.0" --region $Region --output text --query 'IntegrationId'

# Create routes
Write-Host "Creating routes..."
aws apigatewayv2 create-route --api-id $ApiId --route-key "GET /riddles/random" --target "integrations/$RandomRiddleInt" --region $Region
aws apigatewayv2 create-route --api-id $ApiId --route-key "POST /riddles/validate" --target "integrations/$ValidateInt" --region $Region
aws apigatewayv2 create-route --api-id $ApiId --route-key "POST /riddles/solve" --target "integrations/$SolveInt" --region $Region
aws apigatewayv2 create-route --api-id $ApiId --route-key "GET /riddles/progress" --target "integrations/$ProgressInt" --region $Region

# Create stage
Write-Host "Creating stage..."
aws apigatewayv2 create-stage --api-id $ApiId --stage-name $StageName --auto-deploy --region $Region

# Create deployment
Write-Host "Creating deployment..."
aws apigatewayv2 create-deployment --api-id $ApiId --stage-name $StageName --region $Region

# Grant permissions
Write-Host "Granting Lambda permissions..."
foreach ($func in @("GetRandomRiddleFunction", "ValidateAnswerFunction", "SolveRiddleFunction", "GetPlayerProgressFunction")) {
    aws lambda add-permission --function-name $func --statement-id apigateway-access --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:${Region}:${AccountId}:${ApiId}/*/*" --region $Region
}

Write-Host "✅ Done! API endpoint: https://${ApiId}.execute-api.${Region}.amazonaws.com/${StageName}"
```

---

## Quick Copy-Paste Commands

### All-in-One (Copy and paste into PowerShell)

```powershell
$ApiId="pit5nsq8w0";$Region="ap-southeast-2";$StageName="prod";$AccountId=aws sts get-caller-identity --query Account --output text;$RandomRiddleInt=aws apigatewayv2 create-integration --api-id $ApiId --integration-type AWS_PROXY --integration-uri "arn:aws:lambda:${Region}:${AccountId}:function:GetRandomRiddleFunction" --payload-format-version "2.0" --region $Region --output text --query 'IntegrationId';$ValidateInt=aws apigatewayv2 create-integration --api-id $ApiId --integration-type AWS_PROXY --integration-uri "arn:aws:lambda:${Region}:${AccountId}:function:ValidateAnswerFunction" --payload-format-version "2.0" --region $Region --output text --query 'IntegrationId';$SolveInt=aws apigatewayv2 create-integration --api-id $ApiId --integration-type AWS_PROXY --integration-uri "arn:aws:lambda:${Region}:${AccountId}:function:SolveRiddleFunction" --payload-format-version "2.0" --region $Region --output text --query 'IntegrationId';$ProgressInt=aws apigatewayv2 create-integration --api-id $ApiId --integration-type AWS_PROXY --integration-uri "arn:aws:lambda:${Region}:${AccountId}:function:GetPlayerProgressFunction" --payload-format-version "2.0" --region $Region --output text --query 'IntegrationId';aws apigatewayv2 create-route --api-id $ApiId --route-key "GET /riddles/random" --target "integrations/$RandomRiddleInt" --region $Region;aws apigatewayv2 create-route --api-id $ApiId --route-key "POST /riddles/validate" --target "integrations/$ValidateInt" --region $Region;aws apigatewayv2 create-route --api-id $ApiId --route-key "POST /riddles/solve" --target "integrations/$SolveInt" --region $Region;aws apigatewayv2 create-route --api-id $ApiId --route-key "GET /riddles/progress" --target "integrations/$ProgressInt" --region $Region;aws apigatewayv2 create-stage --api-id $ApiId --stage-name $StageName --auto-deploy --region $Region;aws apigatewayv2 create-deployment --api-id $ApiId --stage-name $StageName --region $Region;foreach ($func in @("GetRandomRiddleFunction","ValidateAnswerFunction","SolveRiddleFunction","GetPlayerProgressFunction")) { aws lambda add-permission --function-name $func --statement-id apigateway-access --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:${Region}:${AccountId}:${ApiId}/*/*" --region $Region };Write-Host "✅ Done!"
```

---

## Troubleshooting

### Command Not Found
Make sure AWS CLI is installed:
```powershell
aws --version
```

### Invalid JSON
If you get JSON parsing errors, check the output format:
```powershell
aws apigatewayv2 get-routes --api-id pit5nsq8w0 --region ap-southeast-2 --output json
```

### Permission Denied
Check AWS credentials:
```powershell
aws sts get-caller-identity
```

### Integration URI Error
Make sure Lambda function names are correct:
```powershell
aws lambda list-functions --region ap-southeast-2 --query 'Functions[*].FunctionName'
```

