#!/bin/bash

# Fix API Gateway 404 Errors
# This script fixes common issues causing 404 errors in HTTP API Gateway

set -e

# Configuration
API_ID=${1:-pit5nsq8w0}
REGION=${2:-ap-southeast-2}
STAGE_NAME=${3:-prod}

echo "🔧 Fixing API Gateway 404 Errors"
echo "=================================="
echo "API ID: $API_ID"
echo "Region: $REGION"
echo "Stage: $STAGE_NAME"
echo ""

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✅ AWS Account ID: $ACCOUNT_ID"
echo ""

# Step 1: Check if routes exist
echo "📋 Step 1: Checking existing routes..."
ROUTES=$(aws apigatewayv2 get-routes --api-id $API_ID --region $REGION --query 'Items[*].RouteKey' --output text 2>/dev/null || echo "")

if [ -z "$ROUTES" ]; then
  echo "⚠️  No routes found. Creating routes..."
  
  # Create integrations first
  echo "🔗 Creating Lambda integrations..."
  
  # Get Random Riddle Integration
  RANDOM_RIDDLE_INT=$(aws apigatewayv2 create-integration \
    --api-id $API_ID \
    --integration-type AWS_PROXY \
    --integration-uri "arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:GetRandomRiddleFunction" \
    --payload-format-version "2.0" \
    --region $REGION \
    --query 'IntegrationId' \
    --output text)
  echo "✅ Random Riddle Integration: $RANDOM_RIDDLE_INT"
  
  # Validate Answer Integration
  VALIDATE_INT=$(aws apigatewayv2 create-integration \
    --api-id $API_ID \
    --integration-type AWS_PROXY \
    --integration-uri "arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:ValidateAnswerFunction" \
    --payload-format-version "2.0" \
    --region $REGION \
    --query 'IntegrationId' \
    --output text)
  echo "✅ Validate Answer Integration: $VALIDATE_INT"
  
  # Solve Riddle Integration
  SOLVE_INT=$(aws apigatewayv2 create-integration \
    --api-id $API_ID \
    --integration-type AWS_PROXY \
    --integration-uri "arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:SolveRiddleFunction" \
    --payload-format-version "2.0" \
    --region $REGION \
    --query 'IntegrationId' \
    --output text)
  echo "✅ Solve Riddle Integration: $SOLVE_INT"
  
  # Get Player Progress Integration
  PROGRESS_INT=$(aws apigatewayv2 create-integration \
    --api-id $API_ID \
    --integration-type AWS_PROXY \
    --integration-uri "arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:GetPlayerProgressFunction" \
    --payload-format-version "2.0" \
    --region $REGION \
    --query 'IntegrationId' \
    --output text)
  echo "✅ Get Player Progress Integration: $PROGRESS_INT"
  echo ""
  
  # Create routes
  echo "🛣️  Creating routes..."
  
  aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key "GET /riddles/random" \
    --target "integrations/$RANDOM_RIDDLE_INT" \
    --region $REGION > /dev/null
  echo "✅ Route created: GET /riddles/random"
  
  aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key "POST /riddles/validate" \
    --target "integrations/$VALIDATE_INT" \
    --region $REGION > /dev/null
  echo "✅ Route created: POST /riddles/validate"
  
  aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key "POST /riddles/solve" \
    --target "integrations/$SOLVE_INT" \
    --region $REGION > /dev/null
  echo "✅ Route created: POST /riddles/solve"
  
  aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key "GET /riddles/progress" \
    --target "integrations/$PROGRESS_INT" \
    --region $REGION > /dev/null
  echo "✅ Route created: GET /riddles/progress"
  echo ""
else
  echo "✅ Routes already exist: $ROUTES"
  echo ""
fi

# Step 2: Check if stage exists
echo "📋 Step 2: Checking stages..."
STAGE_EXISTS=$(aws apigatewayv2 get-stages --api-id $API_ID --region $REGION --query "Items[?StageName=='$STAGE_NAME'].StageName" --output text 2>/dev/null || echo "")

if [ -z "$STAGE_EXISTS" ]; then
  echo "⚠️  Stage '$STAGE_NAME' not found. Creating stage..."
  
  aws apigatewayv2 create-stage \
    --api-id $API_ID \
    --stage-name $STAGE_NAME \
    --auto-deploy \
    --region $REGION > /dev/null
  
  echo "✅ Stage created: $STAGE_NAME (with auto-deploy enabled)"
else
  echo "✅ Stage already exists: $STAGE_NAME"
fi
echo ""

# Step 3: Create deployment
echo "📋 Step 3: Creating deployment..."
DEPLOYMENT=$(aws apigatewayv2 create-deployment \
  --api-id $API_ID \
  --stage-name $STAGE_NAME \
  --region $REGION \
  --query 'DeploymentId' \
  --output text)

echo "✅ Deployment created: $DEPLOYMENT"
echo ""

# Step 4: Grant Lambda permissions
echo "📋 Step 4: Granting Lambda invoke permissions..."

LAMBDA_FUNCTIONS=(
  "GetRandomRiddleFunction"
  "ValidateAnswerFunction"
  "SolveRiddleFunction"
  "GetPlayerProgressFunction"
)

for func in "${LAMBDA_FUNCTIONS[@]}"; do
  # Remove existing permission if it exists
  aws lambda remove-permission \
    --function-name $func \
    --statement-id apigateway-access \
    --region $REGION 2>/dev/null || true
  
  # Add new permission
  aws lambda add-permission \
    --function-name $func \
    --statement-id apigateway-access \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/*" \
    --region $REGION > /dev/null
  
  echo "✅ Permission granted: $func"
done
echo ""

# Step 5: Display API endpoint
echo "=================================="
echo "✅ API Gateway Fixed!"
echo "=================================="
echo ""
echo "📍 API Endpoint:"
echo "   https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE_NAME}"
echo ""
echo "🧪 Test endpoints:"
echo "   curl https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE_NAME}/riddles/random"
echo "   curl -X POST https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE_NAME}/riddles/validate -H 'Content-Type: application/json' -d '{\"riddleId\":\"test\",\"answer\":\"test\"}'"
echo ""
echo "📝 Next steps:"
echo "1. Test the endpoints using the commands above"
echo "2. If still getting 404, check Lambda function permissions"
echo "3. Check CloudWatch logs for Lambda execution errors"
echo ""
