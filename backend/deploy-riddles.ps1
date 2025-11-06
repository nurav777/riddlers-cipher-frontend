# Gotham Cipher Riddles Deployment Script (PowerShell)
# This script sets up the riddle delivery system

Write-Host "🦇 Gotham Cipher Riddles Deployment" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Check if AWS CLI is installed
try {
    aws --version | Out-Null
    Write-Host "✅ AWS CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
try {
    node --version | Out-Null
    Write-Host "✅ Node.js is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    npm --version | Out-Null
    Write-Host "✅ npm is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prerequisites check passed" -ForegroundColor Green

# Check AWS credentials
Write-Host "🔐 Checking AWS credentials..." -ForegroundColor Yellow
try {
    aws sts get-caller-identity | Out-Null
    Write-Host "✅ AWS credentials configured" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS credentials not configured. Please run 'aws configure' first." -ForegroundColor Red
    exit 1
}

# Get AWS region
$AWS_REGION = aws configure get region
if ([string]::IsNullOrEmpty($AWS_REGION)) {
    $AWS_REGION = "us-east-1"
    Write-Host "⚠️  No AWS region configured, using default: $AWS_REGION" -ForegroundColor Yellow
}

Write-Host "🌍 Using AWS region: $AWS_REGION" -ForegroundColor Cyan

# Set environment variables
$env:AWS_REGION = $AWS_REGION
$env:RIDDLES_TABLE_NAME = "GothamRiddles"
$env:PROGRESS_TABLE_NAME = "PlayerProgress"
$env:CLOUDWATCH_LOG_GROUP = "GothamCipherRiddles"
$env:CLOUDWATCH_LOG_STREAM = "RiddleService"
$env:CLOUDWATCH_NAMESPACE = "GothamCipher/Riddles"

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "🔨 Building TypeScript..." -ForegroundColor Yellow
npm run build

Write-Host "🗄️  Creating DynamoDB tables..." -ForegroundColor Yellow

# Create GothamRiddles table
Write-Host "Creating GothamRiddles table..." -ForegroundColor Yellow
try {
    aws dynamodb create-table --table-name $env:RIDDLES_TABLE_NAME --cli-input-json file://create-riddles-table.json --region $AWS_REGION
    Write-Host "✅ GothamRiddles table created" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  GothamRiddles table may already exist" -ForegroundColor Blue
}

# Create PlayerProgress table
Write-Host "Creating PlayerProgress table..." -ForegroundColor Yellow
try {
    aws dynamodb create-table --table-name $env:PROGRESS_TABLE_NAME --cli-input-json file://create-player-progress-table.json --region $AWS_REGION
    Write-Host "✅ PlayerProgress table created" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  PlayerProgress table may already exist" -ForegroundColor Blue
}

# Wait for tables to be active
Write-Host "⏳ Waiting for tables to be active..." -ForegroundColor Yellow
aws dynamodb wait table-exists --table-name $env:RIDDLES_TABLE_NAME --region $AWS_REGION
aws dynamodb wait table-exists --table-name $env:PROGRESS_TABLE_NAME --region $AWS_REGION

Write-Host "✅ Tables created successfully" -ForegroundColor Green

Write-Host "📊 Migrating riddles..." -ForegroundColor Yellow
npm run migrate-riddles

Write-Host "☁️  Setting up CloudWatch logging..." -ForegroundColor Yellow

# Create CloudWatch log group
try {
    aws logs create-log-group --log-group-name $env:CLOUDWATCH_LOG_GROUP --region $AWS_REGION
    Write-Host "✅ CloudWatch log group created" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  CloudWatch log group may already exist" -ForegroundColor Blue
}

# Create CloudWatch log stream
try {
    aws logs create-log-stream --log-group-name $env:CLOUDWATCH_LOG_GROUP --log-stream-name $env:CLOUDWATCH_LOG_STREAM --region $AWS_REGION
    Write-Host "✅ CloudWatch log stream created" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  CloudWatch log stream may already exist" -ForegroundColor Blue
}

Write-Host "✅ CloudWatch logging configured" -ForegroundColor Green

Write-Host "🚀 Starting backend server..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend will be available at: http://localhost:3001" -ForegroundColor White
Write-Host "Health check: http://localhost:3001/health" -ForegroundColor White
Write-Host "API documentation: See RIDDLE_DELIVERY_README.md" -ForegroundColor White
Write-Host ""
Write-Host "To test the API:" -ForegroundColor White
Write-Host "curl -H 'Authorization: Bearer YOUR_JWT_TOKEN' http://localhost:3001/api/riddles/random" -ForegroundColor White
Write-Host ""

# Start the server
npm start
