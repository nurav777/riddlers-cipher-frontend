# AWS Lambda & API Gateway Deployment Guide

## Overview

This guide covers the complete deployment of the Gotham Cipher Backend to AWS Lambda and API Gateway. The backend consists of multiple microservices integrated with AWS Cognito, DynamoDB, Polly, CloudWatch, and SES.

## Architecture

```
Frontend (React)
    ↓
API Gateway (HTTP API)
    ↓
Lambda Functions (8 total)
    ├── Auth Functions (4)
    │   ├── Login
    │   ├── Register
    │   ├── Forgot Password
    │   └── Reset Password
    └── Riddle Functions (4)
        ├── Fetch Random Riddle
        ├── Validate Answer
        ├── Solve Riddle
        └── Get Player Progress
    ↓
AWS Services
├── Cognito (Authentication)
├── DynamoDB (Data Storage)
├── Polly (Text-to-Speech)
├── SES (Email)
└── CloudWatch (Logging & Monitoring)
```

## Prerequisites

### 1. AWS Account Setup
- AWS Account with appropriate permissions
- AWS CLI configured with credentials
- IAM user with Lambda, API Gateway, DynamoDB, Cognito, and SES permissions

### 2. Local Environment
- Node.js 18.x or higher
- npm or yarn
- Serverless Framework CLI: `npm install -g serverless`
- Git

### 3. AWS Resources (Already Created)
- Cognito User Pool: `ap-southeast-2_yrduGqxGb`
- DynamoDB Tables:
  - `UserProfiles` (User data)
  - `GothamRiddles` (Riddle data)
  - `PlayerProgress` (Player progress tracking)
- SES Email: `gamegotham948@gmail.com` (verified)
- CloudWatch Log Group: `GothamCipherRiddles`

## Deployment Steps

### Step 1: Prepare Environment Variables

Create a `.env` file in the backend directory with your credentials:

```bash
# AWS Configuration
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# Cognito Configuration
COGNITO_USER_POOL_ID=your-user-pool-id
COGNITO_CLIENT_ID=your-client-id
COGNITO_CLIENT_SECRET=your-client-secret

# Polly Configuration
POLLY_REGION=ap-southeast-2
POLLY_ACCESS_KEY_ID=your-polly-access-key
POLLY_SECRET_ACCESS_KEY=your-polly-secret-key
POLLY_VOICE_ID=Matthew
POLLY_ENGINE=standard

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=30d

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:8080

# DynamoDB Configuration
DYNAMODB_TABLE_NAME=UserProfiles
RIDDLES_TABLE_NAME=GothamRiddles
PROGRESS_TABLE_NAME=PlayerProgress

# CloudWatch Configuration
CLOUDWATCH_LOG_GROUP=GothamCipherRiddles
CLOUDWATCH_LOG_STREAM=RiddleService
CLOUDWATCH_NAMESPACE=GothamCipher/Riddles

# SES Configuration
SES_FROM_EMAIL=gamegotham948@gmail.com
```

### Step 2: Install Dependencies

```bash
cd backend
npm install
```

This will install:
- AWS SDK v3 clients
- Serverless Framework plugins
- TypeScript and development tools

### Step 3: Build TypeScript

```bash
npm run build
```

This compiles all TypeScript files to JavaScript in the `dist/` directory.

### Step 4: Deploy to AWS

#### Option A: Using Deployment Script (Recommended)

```bash
bash deploy.sh
```

This script will:
1. Validate all environment variables
2. Install dependencies
3. Build TypeScript
4. Deploy all Lambda functions
5. Create API Gateway endpoints
6. Configure IAM roles and permissions

#### Option B: Manual Deployment with Serverless

```bash
npx serverless deploy --stage prod --region ap-southeast-2
```

### Step 5: Get API Gateway URL

After deployment, the Serverless Framework will output the API Gateway URL. It will look like:

```
endpoints:
  POST - https://abc123def456.execute-api.ap-southeast-2.amazonaws.com/prod/auth/login
  POST - https://abc123def456.execute-api.ap-southeast-2.amazonaws.com/prod/auth/register
  ...
```

Save this base URL: `https://abc123def456.execute-api.ap-southeast-2.amazonaws.com/prod`

## API Endpoints

### Authentication Endpoints

#### 1. Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe"
}

Response (201):
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userSub": "cognito-sub-id",
    "email": "user@example.com"
  }
}
```

#### 2. Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response (200):
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "tokens": {
      "accessToken": "...",
      "refreshToken": "...",
      "idToken": "..."
    },
    "jwtToken": "eyJhbGc...",
    "profile": {
      "userId": "cognito-sub",
      "email": "user@example.com",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

#### 3. Forgot Password
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response (200):
{
  "success": true,
  "message": "Password reset code sent to email"
}
```

#### 4. Reset Password
```http
POST /auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "NewPassword123!"
}

Response (200):
{
  "success": true,
  "message": "Password reset successfully"
}
```

### Riddle Endpoints (All Require Authentication)

#### 1. Fetch Random Riddle
```http
GET /riddles/random?levelId=1&difficulty=easy&type=cipher&excludeSolved=true
Authorization: Bearer YOUR_JWT_TOKEN

Response (200):
{
  "success": true,
  "data": {
    "riddleId": "level-1-riddle-1",
    "question": "What am I?",
    "hint": "I am a city...",
    "difficulty": "easy",
    "type": "cipher",
    "levelId": 1
  },
  "message": "Random riddle retrieved successfully"
}
```

#### 2. Validate Answer
```http
POST /riddles/validate
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "riddleId": "level-1-riddle-1",
  "answer": "ARKHAM"
}

Response (200):
{
  "success": true,
  "data": {
    "isValid": true
  },
  "message": "Answer is correct!"
}
```

#### 3. Solve Riddle
```http
POST /riddles/solve
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "riddleId": "level-1-riddle-1",
  "levelId": 1,
  "stars": 3,
  "completionTime": 45000
}

Response (200):
{
  "success": true,
  "data": {
    "playerId": "cognito-sub",
    "solvedRiddles": ["level-1-riddle-1"],
    "totalScore": 300,
    "levelProgress": {
      "1": {
        "completed": true,
        "stars": 3
      }
    }
  },
  "message": "Riddle solved and progress updated"
}
```

#### 4. Get Player Progress
```http
GET /riddles/progress
Authorization: Bearer YOUR_JWT_TOKEN

Response (200):
{
  "success": true,
  "data": {
    "playerId": "cognito-sub",
    "totalScore": 300,
    "levelsCompleted": 1,
    "solvedRiddles": ["level-1-riddle-1"],
    "levelProgress": {
      "1": {
        "completed": true,
        "stars": 3,
        "riddlesSolved": 1
      }
    }
  },
  "message": "Player progress retrieved successfully"
}
```

## Testing

### Automated Testing

Run the test script to validate all endpoints:

```bash
bash test-endpoints.sh https://abc123def456.execute-api.ap-southeast-2.amazonaws.com/prod
```

This will:
1. Test user registration
2. Test user login
3. Test forgot password
4. Test riddle fetching
5. Test answer validation
6. Test riddle solving
7. Test progress retrieval

### Manual Testing with cURL

#### Test Login
```bash
curl -X POST https://your-api-url/prod/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

#### Test Fetch Riddle
```bash
curl -X GET "https://your-api-url/prod/riddles/random?levelId=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Testing with Postman

1. Import the provided Postman collection (if available)
2. Set the base URL to your API Gateway endpoint
3. Set the JWT token in the Authorization header
4. Run the test suite

## Monitoring & Logging

### CloudWatch Logs

View logs for Lambda functions:

```bash
# View logs for a specific function
aws logs tail /aws/lambda/login --follow

# View logs for all functions
aws logs tail /aws/lambda --follow
```

### CloudWatch Metrics

Monitor function performance:

```bash
# View metrics for Lambda functions
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 300 \
  --statistics Average,Maximum
```

### Application Logs

The application logs to CloudWatch with the following structure:

```
Log Group: GothamCipherRiddles
Log Stream: RiddleService
Namespace: GothamCipher/Riddles
```

## Troubleshooting

### Common Issues

#### 1. Deployment Fails with Permission Error
**Solution:** Ensure your AWS credentials have the necessary permissions for Lambda, API Gateway, DynamoDB, and Cognito.

#### 2. Lambda Timeout
**Solution:** Increase the timeout in `serverless.yml`:
```yaml
provider:
  timeout: 60  # Increase from 30 to 60 seconds
```

#### 3. DynamoDB Access Denied
**Solution:** Verify that the Lambda execution role has DynamoDB permissions for the correct table names.

#### 4. Cognito Authentication Fails
**Solution:** 
- Verify Cognito User Pool ID and Client ID
- Ensure the user exists in the Cognito User Pool
- Check that USER_PASSWORD_AUTH flow is enabled

#### 5. CORS Errors
**Solution:** The API Gateway is configured with CORS enabled. If issues persist:
```yaml
functions:
  login:
    events:
      - http:
          path: auth/login
          method: post
          cors:
            origin: '*'
            headers:
              - Content-Type
              - Authorization
```

## Cost Optimization

### Lambda Configuration
- Memory: 512 MB (adjustable based on needs)
- Timeout: 30 seconds (sufficient for most operations)
- Ephemeral storage: 512 MB (default)

### Estimated Monthly Costs
- Lambda: ~$0.20 (1M requests)
- API Gateway: ~$3.50 (1M requests)
- DynamoDB: ~$1.25 (on-demand pricing)
- **Total: ~$5 per month** (for low-traffic applications)

### Cost Reduction Tips
1. Use DynamoDB on-demand pricing for variable workloads
2. Enable Lambda reserved concurrency for predictable traffic
3. Use API Gateway caching for frequently accessed data
4. Monitor CloudWatch logs and set up alarms for unusual activity

## Security Best Practices

### 1. Environment Variables
- Store sensitive data in AWS Secrets Manager
- Never commit `.env` files to version control
- Rotate credentials regularly

### 2. IAM Permissions
- Use least privilege principle
- Create separate IAM roles for each Lambda function
- Audit IAM policies regularly

### 3. API Security
- Enable API Gateway authentication
- Use JWT tokens with expiration
- Implement rate limiting
- Enable CORS only for trusted origins

### 4. Data Protection
- Enable DynamoDB encryption at rest
- Use SSL/TLS for data in transit
- Implement field-level encryption for sensitive data

## Rollback Procedure

If deployment fails or issues arise:

```bash
# View deployment history
npx serverless info --stage prod

# Rollback to previous version
npx serverless rollback --stage prod

# Remove entire deployment
npx serverless remove --stage prod
```

## Next Steps

1. **Update Frontend Configuration**
   - Update API base URL in frontend
   - Configure authentication headers
   - Test all endpoints

2. **Set Up Monitoring**
   - Create CloudWatch alarms
   - Set up SNS notifications
   - Configure error tracking

3. **Performance Optimization**
   - Monitor Lambda cold start times
   - Optimize DynamoDB queries
   - Implement caching strategies

4. **Production Hardening**
   - Enable API Gateway logging
   - Set up WAF rules
   - Implement request throttling

## Support & Documentation

- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [Serverless Framework Documentation](https://www.serverless.com/framework/docs)
- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)

## Deployment Checklist

- [ ] Environment variables configured
- [ ] AWS credentials configured
- [ ] Dependencies installed
- [ ] TypeScript builds successfully
- [ ] Deployment script runs without errors
- [ ] API Gateway URL obtained
- [ ] All endpoints tested
- [ ] Frontend updated with new API URL
- [ ] CloudWatch logs verified
- [ ] Monitoring and alerts configured
- [ ] Security review completed
- [ ] Documentation updated
