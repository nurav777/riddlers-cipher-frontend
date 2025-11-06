#!/bin/bash

# Gotham Cipher Riddles Deployment Script
# This script sets up the riddle delivery system

set -e

echo "🦇 Gotham Cipher Riddles Deployment"
echo "=================================="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install it first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install it first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Check AWS credentials
echo "🔐 Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS credentials configured"

# Get AWS region
AWS_REGION=$(aws configure get region)
if [ -z "$AWS_REGION" ]; then
    AWS_REGION="us-east-1"
    echo "⚠️  No AWS region configured, using default: $AWS_REGION"
fi

echo "🌍 Using AWS region: $AWS_REGION"

# Set environment variables
export AWS_REGION=$AWS_REGION
export RIDDLES_TABLE_NAME="GothamRiddles"
export PROGRESS_TABLE_NAME="PlayerProgress"
export CLOUDWATCH_LOG_GROUP="GothamCipherRiddles"
export CLOUDWATCH_LOG_STREAM="RiddleService"
export CLOUDWATCH_NAMESPACE="GothamCipher/Riddles"

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building TypeScript..."
npm run build

echo "🗄️  Creating DynamoDB tables..."

# Create GothamRiddles table
echo "Creating GothamRiddles table..."
aws dynamodb create-table \
    --table-name $RIDDLES_TABLE_NAME \
    --cli-input-json file://create-riddles-table.json \
    --region $AWS_REGION || echo "Table may already exist"

# Create PlayerProgress table
echo "Creating PlayerProgress table..."
aws dynamodb create-table \
    --table-name $PROGRESS_TABLE_NAME \
    --cli-input-json file://create-player-progress-table.json \
    --region $AWS_REGION || echo "Table may already exist"

# Wait for tables to be active
echo "⏳ Waiting for tables to be active..."
aws dynamodb wait table-exists --table-name $RIDDLES_TABLE_NAME --region $AWS_REGION
aws dynamodb wait table-exists --table-name $PROGRESS_TABLE_NAME --region $AWS_REGION

echo "✅ Tables created successfully"

echo "📊 Migrating riddles..."
npm run migrate-riddles

echo "☁️  Setting up CloudWatch logging..."

# Create CloudWatch log group
aws logs create-log-group \
    --log-group-name $CLOUDWATCH_LOG_GROUP \
    --region $AWS_REGION || echo "Log group may already exist"

# Create CloudWatch log stream
aws logs create-log-stream \
    --log-group-name $CLOUDWATCH_LOG_GROUP \
    --log-stream-name $CLOUDWATCH_LOG_STREAM \
    --region $AWS_REGION || echo "Log stream may already exist"

echo "✅ CloudWatch logging configured"

echo "🚀 Starting backend server..."
echo ""
echo "Backend will be available at: http://localhost:3001"
echo "Health check: http://localhost:3001/health"
echo "API documentation: See RIDDLE_DELIVERY_README.md"
echo ""
echo "To test the API:"
echo "curl -H 'Authorization: Bearer YOUR_JWT_TOKEN' http://localhost:3001/api/riddles/random"
echo ""

# Start the server
npm start
