# Gotham Cipher Riddles - AWS Step Functions Deployment Guide

This guide explains how to deploy the Gotham Cipher Riddles project using AWS Lambda, Step Functions, and API Gateway for a fully serverless architecture with workflow orchestration.

## Architecture Overview

```
Frontend → API Gateway → Step Functions → Lambda Functions → DynamoDB
                    ↓
              CloudWatch Logs & Metrics
```

### Step Functions Workflow
The Step Functions orchestrate the riddle-solving workflow:

1. **GetRandomRiddle** - Retrieves a random riddle for the player
2. **ValidateAnswer** - Validates the player's answer
3. **SolveRiddle** - Updates player progress if answer is correct
4. **GetPlayerProgress** - Returns updated player progress

### Lambda Functions
- GetRandomRiddleFunction
- ValidateAnswerFunction
- SolveRiddleFunction
- GetPlayerProgressFunction

## Prerequisites

- AWS CLI configured with appropriate permissions
- Node.js and npm installed
- DynamoDB tables created (GothamRiddles, PlayerProgress)
- Riddles migrated to DynamoDB
- AWS permissions for Lambda, Step Functions, API Gateway, and DynamoDB

### Required IAM Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:CreateFunction",
        "lambda:UpdateFunctionCode",
        "lambda:InvokeFunction",
        "states:CreateStateMachine",
        "states:StartExecution",
        "apigateway:*",
        "dynamodb:*",
        "logs:*",
        "iam:CreateRole",
        "iam:AttachRolePolicy"
      ],
      "Resource": "*"
    }
  ]
}
```

## Deployment Steps

### Step 1: Deploy Lambda Functions

First, deploy the individual Lambda functions using the existing deployment script:

```bash
cd backend
chmod +x deploy-riddles-lambda.sh
./deploy-riddles-lambda.sh
```

This creates:
- 4 Lambda functions for riddle operations
- IAM execution role with necessary permissions
- Basic API Gateway setup (optional, we'll enhance it)

### Step 2: Create Step Functions State Machine

Create a Step Functions state machine to orchestrate the riddle workflow:

#### Create IAM Role for Step Functions
```bash
aws iam create-role \
  --role-name GothamCipher-StepFunctionsRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "states.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }'

aws iam attach-role-policy \
  --role-name GothamCipher-StepFunctionsRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaRole
```

#### Create Step Functions Definition
Create a file `step-functions-definition.json`:

```json
{
  "Comment": "Gotham Cipher Riddle Solving Workflow",
  "StartAt": "GetRandomRiddle",
  "States": {
    "GetRandomRiddle": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:REGION:ACCOUNT:function:GetRandomRiddleFunction",
      "Parameters": {
        "queryStringParameters.$": "$.queryStringParameters",
        "headers.$": "$.headers"
      },
      "ResultPath": "$.riddleResult",
      "Next": "ValidateAnswer"
    },
    "ValidateAnswer": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:REGION:ACCOUNT:function:ValidateAnswerFunction",
      "Parameters": {
        "body.$": "$.body",
        "headers.$": "$.headers"
      },
      "ResultPath": "$.validationResult",
      "Next": "CheckValidationResult"
    },
    "CheckValidationResult": {
      "Type": "Choice",
      "Choices": [
        {
          "Variable": "$.validationResult.body",
          "StringEquals": "{\"success\":true,\"data\":{\"isValid\":true}}",
          "Next": "SolveRiddle"
        }
      ],
      "Default": "ReturnValidationResult"
    },
    "SolveRiddle": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:REGION:ACCOUNT:function:SolveRiddleFunction",
      "Parameters": {
        "body.$": "$.body",
        "headers.$": "$.headers"
      },
      "ResultPath": "$.solveResult",
      "Next": "GetPlayerProgress"
    },
    "GetPlayerProgress": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:REGION:ACCOUNT:function:GetPlayerProgressFunction",
      "Parameters": {
        "headers.$": "$.headers"
      },
      "ResultPath": "$.progressResult",
      "Next": "ReturnFinalResult"
    },
    "ReturnValidationResult": {
      "Type": "Pass",
      "Result": {
        "statusCode": 200,
        "body.$": "$.validationResult.body"
      },
      "End": true
    },
    "ReturnFinalResult": {
      "Type": "Pass",
      "Result": {
        "statusCode": 200,
        "body": {
          "riddle.$": "$.riddleResult.body",
          "validation.$": "$.validationResult.body",
          "solve.$": "$.solveResult.body",
          "progress.$": "$.progressResult.body"
        }
      },
      "End": true
    }
  }
}
```

#### Deploy Step Functions State Machine
```bash
# Replace REGION and ACCOUNT with your values
REGION=us-east-1
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)

aws stepfunctions create-state-machine \
  --name "GothamCipher-RiddleWorkflow" \
  --definition file://step-functions-definition.json \
  --role-arn "arn:aws:iam::${ACCOUNT}:role/GothamCipher-StepFunctionsRole" \
  --type EXPRESS
```

### Step 3: Create API Gateway with Step Functions Integration

#### Create API Gateway
```bash
API_ID=$(aws apigatewayv2 create-api \
  --name "GothamCipher-StepFunctions-API" \
  --protocol-type HTTP \
  --cors-configuration '{
    "AllowOrigins": ["http://localhost:8080", "https://yourdomain.com"],
    "AllowMethods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "AllowHeaders": ["Content-Type", "Authorization"],
    "AllowCredentials": true
  }' \
  --query 'ApiId' \
  --output text)

echo "API Gateway created with ID: $API_ID"
```

#### Create Integration with Step Functions
```bash
STATE_MACHINE_ARN=$(aws stepfunctions list-state-machines \
  --query 'stateMachines[?name==`GothamCipher-RiddleWorkflow`].stateMachineArn' \
  --output text)

INTEGRATION_ID=$(aws apigatewayv2 create-integration \
  --api-id $API_ID \
  --integration-type AWS_PROXY \
  --integration-subtype StepFunctions \
  --integration-method POST \
  --payload-format-version "1.0" \
  --credentials-arn "arn:aws:iam::${ACCOUNT}:role/GothamCipher-StepFunctionsRole" \
  --request-parameters '{
    "StateMachineArn": "'$STATE_MACHINE_ARN'",
    "Input": "$request.body"
  }' \
  --query 'IntegrationId' \
  --output text)
```

#### Create API Routes
```bash
# Create route for riddle workflow
aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key "POST /riddles/workflow" \
  --target "integrations/$INTEGRATION_ID"

# Create route for getting random riddle only
aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key "GET /riddles/random" \
  --target "integrations/$(aws apigatewayv2 create-integration \
    --api-id $API_ID \
    --integration-type AWS_PROXY \
    --integration-uri "arn:aws:lambda:${REGION}:${ACCOUNT}:function:GetRandomRiddleFunction" \
    --query 'IntegrationId' \
    --output text)"

# Create route for player progress
aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key "GET /riddles/progress" \
  --target "integrations/$(aws apigatewayv2 create-integration \
    --api-id $API_ID \
    --integration-type AWS_PROXY \
    --integration-uri "arn:aws:lambda:${REGION}:${ACCOUNT}:function:GetPlayerProgressFunction" \
    --query 'IntegrationId' \
    --output text)"
```

#### Deploy API Gateway
```bash
aws apigatewayv2 create-deployment \
  --api-id $API_ID \
  --stage-name prod

API_URL=$(aws apigatewayv2 get-api \
  --api-id $API_ID \
  --query 'ApiEndpoint' \
  --output text)

echo "API Gateway deployed at: $API_URL"
```

### Step 4: Update Frontend Configuration

Update your frontend API base URL:

```typescript
// In src/lib/api.ts
const apiBaseUrl = "https://your-api-gateway-url.amazonaws.com/prod";
```

## API Endpoints

### Complete Riddle Workflow
```http
POST /riddles/workflow
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "queryStringParameters": {
    "levelId": "1",
    "difficulty": "easy",
    "type": "cipher",
    "excludeSolved": "true"
  },
  "body": "{\"riddleId\":\"level-1-riddle-1\",\"answer\":\"ARKHAM\",\"levelId\":1,\"stars\":3,\"completionTime\":45000}",
  "headers": {
    "Authorization": "Bearer YOUR_JWT_TOKEN"
  }
}
```

### Get Random Riddle Only
```http
GET /riddles/random?levelId=1&difficulty=easy&type=cipher&excludeSolved=true
Authorization: Bearer YOUR_JWT_TOKEN
```

### Get Player Progress
```http
GET /riddles/progress
Authorization: Bearer YOUR_JWT_TOKEN
```

## Testing the Deployment

### Test Step Functions Workflow
```bash
# Test the complete workflow
curl -X POST "$API_URL/riddles/workflow" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "queryStringParameters": {
      "levelId": "1",
      "difficulty": "easy"
    },
    "body": "{\"riddleId\":\"level-1-riddle-1\",\"answer\":\"ARKHAM\",\"levelId\":1,\"stars\":3,\"completionTime\":45000}",
    "headers": {
      "Authorization": "Bearer YOUR_JWT_TOKEN"
    }
  }'
```

### Test Individual Endpoints
```bash
# Test random riddle endpoint
curl "$API_URL/riddles/random?levelId=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test progress endpoint
curl "$API_URL/riddles/progress" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Monitor Step Functions Executions
```bash
# List recent executions
aws stepfunctions list-executions \
  --state-machine-arn $STATE_MACHINE_ARN \
  --max-results 10

# Get execution details
EXECUTION_ARN=$(aws stepfunctions list-executions \
  --state-machine-arn $STATE_MACHINE_ARN \
  --query 'executions[0].executionArn' \
  --output text)

aws stepfunctions get-execution-history \
  --execution-arn $EXECUTION_ARN
```

## Monitoring

### CloudWatch Metrics
- **Step Functions**: Execution metrics, success/failure rates
- **Lambda**: Invocation counts, duration, errors
- **API Gateway**: Request counts, latency, error rates

### Sample CloudWatch Queries
```sql
-- Step Functions execution success rate
fields @timestamp, execution_arn, status
| filter state_machine_arn = '$STATE_MACHINE_ARN'
| stats count() by status

-- Lambda function performance
fields @timestamp, @duration, @memorySize, @maxMemoryUsed
| filter @message like /REPORT/
| stats avg(@duration) as avg_duration, max(@maxMemoryUsed) as max_memory
```

### Setting up Alarms
```bash
# Create alarm for Step Functions failures
aws cloudwatch put-metric-alarm \
  --alarm-name "StepFunctions-Failures" \
  --alarm-description "Alert when Step Functions executions fail" \
  --metric-name "ExecutionsFailed" \
  --namespace "AWS/States" \
  --statistic "Sum" \
  --period 300 \
  --threshold 1 \
  --comparison-operator "GreaterThanThreshold" \
  --dimensions Name=StateMachineArn,Value=$STATE_MACHINE_ARN
```

## Cost Optimization

### Step Functions Configuration
- Use **EXPRESS** workflow type for synchronous executions (lower cost)
- Standard workflow for long-running processes if needed

### Lambda Configuration
- Memory: 256MB (sufficient for riddle operations)
- Timeout: 30 seconds
- Enable provisioned concurrency for consistent performance

### API Gateway
- Use HTTP API instead of REST API (lower cost)
- Enable caching for frequently accessed data
- Set up throttling to control costs

## Troubleshooting

### Common Issues

1. **Step Functions Execution Failures**
   ```bash
   # Check execution history
   aws stepfunctions get-execution-history \
     --execution-arn $EXECUTION_ARN \
     --query 'events[?type==`ExecutionFailed`]'
   ```

2. **Lambda Permission Errors**
   - Ensure Step Functions role has lambda:InvokeFunction permission
   - Check IAM role policies

3. **API Gateway Integration Issues**
   - Verify integration URI and credentials
   - Check API Gateway logs in CloudWatch

### Debug Commands

```bash
# Check Step Functions state machine
aws stepfunctions describe-state-machine \
  --state-machine-arn $STATE_MACHINE_ARN

# Test Lambda function directly
aws lambda invoke \
  --function-name GetRandomRiddleFunction \
  --payload '{"queryStringParameters":{"levelId":"1"},"headers":{"Authorization":"Bearer YOUR_TOKEN"}}' \
  output.json

# Check API Gateway routes
aws apigatewayv2 get-routes --api-id $API_ID
```

## Scaling Considerations

### Auto-scaling
- Lambda automatically scales with concurrent executions
- Step Functions can handle thousands of concurrent executions
- API Gateway scales automatically

### Performance Optimization
- Use DynamoDB DAX for caching if needed
- Implement connection pooling in Lambda functions
- Monitor cold start times and optimize if necessary

## Security

### Authentication
- JWT tokens validated in Lambda functions
- API Gateway provides HTTPS enforcement
- Step Functions executions are secured with IAM

### Data Protection
- All data encrypted at rest in DynamoDB
- API Gateway enforces HTTPS
- IAM roles follow least privilege principle

### Network Security
- Use VPC endpoints for enhanced security (optional)
- Configure security groups if using VPC

## Next Steps

1. **Deploy the Lambda functions** using the provided script
2. **Create the Step Functions state machine** with the workflow definition
3. **Set up API Gateway** with Step Functions integration
4. **Test all endpoints** thoroughly
5. **Configure monitoring** and alerts
6. **Update frontend** to use the new API endpoints
7. **Set up CI/CD** for automated deployments

This architecture provides:
- ✅ **Workflow Orchestration** with Step Functions
- ✅ **Serverless Scalability** with Lambda
- ✅ **Pay-per-use Pricing** across all services
- ✅ **Built-in Monitoring** and logging
- ✅ **High Availability** and fault tolerance
- ✅ **Cost Optimization** through efficient resource usage

## Additional Resources

- [AWS Step Functions Documentation](https://docs.aws.amazon.com/step-functions/)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [API Gateway Developer Guide](https://docs.aws.amazon.com/apigateway/latest/developerguide/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
