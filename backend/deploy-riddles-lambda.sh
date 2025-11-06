#!/bin/bash

# Deploy Riddle Lambda Functions for Gotham Cipher
# This script deploys all riddle-related Lambda functions

set -e

# Configuration
REGION=${AWS_REGION:-ap-southeast-2}
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
FUNCTION_PREFIX="GothamCipherRiddles"

echo " Deploying Riddle Lambda functions to region: $REGION"
echo " Account ID: $ACCOUNT_ID"

# Create IAM role for Lambda execution
echo " Creating IAM role for Lambda execution..."
aws iam create-role \
  --role-name ${FUNCTION_PREFIX}-LambdaExecutionRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "lambda.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }' || echo "Role already exists"

# Attach basic execution policy
aws iam attach-role-policy \
  --role-name ${FUNCTION_PREFIX}-LambdaExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Attach DynamoDB policy
aws iam attach-role-policy \
  --role-name ${FUNCTION_PREFIX}-LambdaExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess

# Attach CloudWatch policy
aws iam attach-role-policy \
  --role-name ${FUNCTION_PREFIX}-LambdaExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess

# Wait for role to be ready
echo " Waiting for IAM role to be ready..."
sleep 10

# Create deployment directory
mkdir -p deployments

# Package and deploy each Lambda function
FUNCTIONS=(
  "riddles/getRandomRiddle:GetRandomRiddleFunction"
  "riddles/validateAnswer:ValidateAnswerFunction"
  "riddles/solveRiddle:SolveRiddleFunction"
  "riddles/getPlayerProgress:GetPlayerProgressFunction"
)

for func in "${FUNCTIONS[@]}"; do
  IFS=':' read -r path name <<< "$func"
  
  echo " Packaging $name..."
  
  # Create deployment package
  cd lambda/$path
  npm install --production
  zip -r ../../../deployments/${name}.zip . -x "*.ts" "*.map" "node_modules/@types/*"
  cd ../../..
  
  echo " Deploying $name..."
  
  # Create or update function
  aws lambda create-function \
    --function-name $name \
    --runtime nodejs18.x \
    --role arn:aws:iam::${ACCOUNT_ID}:role/${FUNCTION_PREFIX}-LambdaExecutionRole \
    --handler index.handler \
    --zip-file fileb://deployments/${name}.zip \
    --environment Variables="{
      AWS_REGION=$REGION,
      RIDDLES_TABLE_NAME=GothamRiddles,
      PROGRESS_TABLE_NAME=PlayerProgress,
      CLOUDWATCH_LOG_GROUP=GothamCipherRiddles,
      CLOUDWATCH_LOG_STREAM=RiddleService,
      CLOUDWATCH_NAMESPACE=GothamCipher/Riddles,
      JWT_SECRET=$JWT_SECRET
    }" \
    --timeout 30 \
    --memory-size 256 \
    || aws lambda update-function-code \
      --function-name $name \
      --zip-file fileb://deployments/${name}.zip
done

echo " Riddle Lambda functions deployed successfully!"

# Create API Gateway for riddles
echo " Creating API Gateway for riddles..."
API_ID=$(aws apigatewayv2 create-api \
  --name ${FUNCTION_PREFIX}-API \
  --protocol-type HTTP \
  --cors-configuration '{
    "AllowOrigins": ["http://localhost:8080", "https://yourdomain.com"],
    "AllowMethods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "AllowHeaders": ["Content-Type", "Authorization"],
    "AllowCredentials": true
  }' \
  --query 'ApiId' \
  --output text 2>/dev/null || echo "API already exists")

if [ "$API_ID" = "API already exists" ]; then
  echo "ℹ️  API Gateway already exists"
else
  echo "✅ API Gateway created with ID: $API_ID"
  
  # Create routes for each function
  echo "🛣️  Creating API Gateway routes..."
  
  # Get Random Riddle route
  aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key "GET /riddles/random" \
    --target "integrations/$(aws apigatewayv2 create-integration \
      --api-id $API_ID \
      --integration-type AWS_PROXY \
      --integration-uri "arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:GetRandomRiddleFunction" \
      --query 'IntegrationId' \
      --output text)"
  
  # Validate Answer route
  aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key "POST /riddles/validate" \
    --target "integrations/$(aws apigatewayv2 create-integration \
      --api-id $API_ID \
      --integration-type AWS_PROXY \
      --integration-uri "arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:ValidateAnswerFunction" \
      --query 'IntegrationId' \
      --output text)"
  
  # Solve Riddle route
  aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key "POST /riddles/solve" \
    --target "integrations/$(aws apigatewayv2 create-integration \
      --api-id $API_ID \
      --integration-type AWS_PROXY \
      --integration-uri "arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:SolveRiddleFunction" \
      --query 'IntegrationId' \
      --output text)"
  
  # Get Player Progress route
  aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key "GET /riddles/progress" \
    --target "integrations/$(aws apigatewayv2 create-integration \
      --api-id $API_ID \
      --integration-type AWS_PROXY \
      --integration-uri "arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:GetPlayerProgressFunction" \
      --query 'IntegrationId' \
      --output text)"
  
  # Deploy the API
  aws apigatewayv2 create-deployment \
    --api-id $API_ID \
    --stage-name prod
  
  echo "🎉 API Gateway routes created and deployed!"
fi

echo "🎉 Riddle Lambda deployment complete!"
echo "📝 Next steps:"
echo "1. Test the Lambda functions"
echo "2. Update frontend to use API Gateway endpoints"
echo "3. Configure custom domain (optional)"
