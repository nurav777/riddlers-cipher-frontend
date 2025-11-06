#!/bin/bash

# Deploy Lambda Functions for Gotham Cipher
# This script deploys all Lambda functions with proper IAM roles

set -e

# Configuration
REGION=${AWS_REGION:-us-east-1}
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
FUNCTION_PREFIX="GothamCipher"

echo "🚀 Deploying Lambda functions to region: $REGION"
echo "📋 Account ID: $ACCOUNT_ID"

# Create IAM role for Lambda execution
echo "🔐 Creating IAM role for Lambda execution..."
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

# Attach policies
aws iam attach-role-policy \
  --role-name ${FUNCTION_PREFIX}-LambdaExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam put-role-policy \
  --role-name ${FUNCTION_PREFIX}-LambdaExecutionRole \
  --policy-name DynamoDBAccess \
  --policy-document file://iam/lambda-execution-policy.json

# Wait for role to be ready
echo "⏳ Waiting for IAM role to be ready..."
sleep 10

# Package and deploy each Lambda function
FUNCTIONS=(
  "auth/login:LoginFunction"
  "profile/getProfile:GetProfileFunction"
  "profile/updateProfile:UpdateProfileFunction"
)

for func in "${FUNCTIONS[@]}"; do
  IFS=':' read -r path name <<< "$func"
  
  echo "📦 Packaging $name..."
  
  # Create deployment package
  cd lambda/$path
  npm install
  zip -r ../../../deployments/${name}.zip .
  cd ../../..
  
  echo "🚀 Deploying $name..."
  
  # Create or update function
  aws lambda create-function \
    --function-name $name \
    --runtime nodejs18.x \
    --role arn:aws:iam::${ACCOUNT_ID}:role/${FUNCTION_PREFIX}-LambdaExecutionRole \
    --handler index.handler \
    --zip-file fileb://deployments/${name}.zip \
    --environment Variables="{
      AWS_REGION=$REGION,
      DYNAMODB_TABLE_NAME=UserProfiles,
      COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID,
      COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID,
      COGNITO_CLIENT_SECRET=$COGNITO_CLIENT_SECRET,
      JWT_SECRET=$JWT_SECRET
    }" \
    --timeout 30 \
    --memory-size 256 \
    || aws lambda update-function-code \
      --function-name $name \
      --zip-file fileb://deployments/${name}.zip
done

echo "✅ Lambda functions deployed successfully!"

# Create API Gateway
echo "🌐 Creating API Gateway..."
aws apigatewayv2 create-api \
  --name ${FUNCTION_PREFIX}-API \
  --protocol-type HTTP \
  --cors-configuration '{
    "AllowOrigins": ["http://localhost:8080", "https://yourdomain.com"],
    "AllowMethods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "AllowHeaders": ["Content-Type", "Authorization"],
    "AllowCredentials": true
  }' || echo "API Gateway already exists"

echo "🎉 Deployment complete!"
echo "📝 Next steps:"
echo "1. Configure API Gateway routes"
echo "2. Update frontend to use API Gateway endpoints"
echo "3. Test the authentication flow"
