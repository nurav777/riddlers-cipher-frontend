#!/bin/bash

# Gotham Cipher Backend - AWS Lambda Deployment Script
# This script deploys all Lambda functions and API Gateway endpoints

set -e

echo "🦇 Gotham Cipher Backend - AWS Lambda Deployment"
echo "=================================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with the required environment variables."
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '#' | xargs)

# Check required environment variables
required_vars=(
    "AWS_REGION"
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "COGNITO_USER_POOL_ID"
    "COGNITO_CLIENT_ID"
    "JWT_SECRET"
    "DYNAMODB_TABLE_NAME"
    "RIDDLES_TABLE_NAME"
    "PROGRESS_TABLE_NAME"
)

echo "📋 Checking required environment variables..."
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Missing environment variable: $var"
        exit 1
    fi
done

echo "✅ All required environment variables are set"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Build TypeScript
echo ""
echo "🔨 Building TypeScript..."
npm run build

# Deploy with Serverless Framework
echo ""
echo "🚀 Deploying to AWS Lambda..."
npx serverless deploy --stage prod --region ${AWS_REGION}

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Get your API Gateway URL from the deployment output above"
echo "2. Update your frontend API configuration with the new URL"
echo "3. Test the endpoints using the provided test script"
echo ""
echo "🧪 To test the endpoints, run:"
echo "   bash test-endpoints.sh <API_GATEWAY_URL>"
