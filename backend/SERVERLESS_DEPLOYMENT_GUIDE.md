# Serverless Riddle Delivery System - Deployment Guide

## Architecture Overview

This implementation uses **AWS Lambda** and **API Gateway** for a truly serverless architecture:

```
Frontend → API Gateway → Lambda Functions → DynamoDB
                    ↓
              CloudWatch Logs & Metrics
```

## Lambda Functions Created

1. **GetRandomRiddleFunction** - Retrieves random riddles for players
2. **ValidateAnswerFunction** - Validates player answers
3. **SolveRiddleFunction** - Updates player progress when riddles are solved
4. **GetPlayerProgressFunction** - Retrieves player progress data

## Prerequisites

- AWS CLI configured with appropriate permissions
- DynamoDB tables already created (GothamRiddles, PlayerProgress)
- Riddles already migrated to DynamoDB

## Deployment Steps

### 1. Make Script Executable
```bash
chmod +x deploy-riddles-lambda.sh
```

### 2. Deploy Lambda Functions
```bash
./deploy-riddles-lambda.sh
```

This script will:
- Create IAM roles for Lambda execution
- Package and deploy all Lambda functions
- Create API Gateway with routes
- Configure CORS and permissions

### 3. Get API Gateway URL
After deployment, get your API Gateway URL:
```bash
aws apigatewayv2 get-apis --query 'Items[?Name==`GothamCipherRiddles-API`].ApiEndpoint' --output text
```

### 4. Update Frontend Configuration
Update your frontend API base URL to use the API Gateway endpoint:

```typescript
// In src/lib/api.ts
const apiBaseUrl = "https://your-api-gateway-url.amazonaws.com/prod";
```

## API Endpoints

### Get Random Riddle
```http
GET /riddles/random?levelId=1&difficulty=easy&type=cipher&excludeSolved=true
Authorization: Bearer YOUR_JWT_TOKEN
```

### Validate Answer
```http
POST /riddles/validate
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "riddleId": "level-1-riddle-1",
  "answer": "ARKHAM"
}
```

### Solve Riddle
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
```

### Get Player Progress
```http
GET /riddles/progress
Authorization: Bearer YOUR_JWT_TOKEN
```

## Testing the Deployment

### 1. Test Lambda Functions Directly
```bash
# Test GetRandomRiddle function
aws lambda invoke \
  --function-name GetRandomRiddleFunction \
  --payload '{"queryStringParameters":{"levelId":"1"}}' \
  response.json

cat response.json
```

### 2. Test API Gateway
```bash
# Test health endpoint
curl https://your-api-gateway-url.amazonaws.com/prod/riddles/random \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Monitoring

### CloudWatch Logs
- Log Group: `GothamCipherRiddles`
- Log Stream: `RiddleService`

### CloudWatch Metrics
- Namespace: `GothamCipher/Riddles`
- Metrics: RiddleRequests, RiddleCompletions, Errors, Performance

### Sample Queries
```sql
-- Most popular riddle types
fields @timestamp, metadata.type
| filter metadata.action = "riddle_request"
| stats count() by metadata.type

-- Average completion time by level
fields @timestamp, metadata.completionTime, metadata.levelId
| filter metadata.action = "riddle_completion"
| stats avg(metadata.completionTime) by metadata.levelId
```

## Cost Optimization

### Lambda Configuration
- Memory: 256MB (sufficient for riddle operations)
- Timeout: 30 seconds
- Cold start optimization: Keep functions warm

### DynamoDB Configuration
- On-demand billing for variable workloads
- Consider provisioned capacity for predictable traffic

### API Gateway
- HTTP API (cheaper than REST API)
- Caching enabled for frequently accessed data

## Troubleshooting

### Common Issues

1. **Lambda timeout errors**
   - Increase timeout in function configuration
   - Check DynamoDB connection

2. **Permission denied errors**
   - Check IAM role permissions
   - Verify DynamoDB table access

3. **CORS errors**
   - Verify API Gateway CORS configuration
   - Check frontend origin settings

### Debug Commands

```bash
# Check Lambda function logs
aws logs tail /aws/lambda/GetRandomRiddleFunction --follow

# Test DynamoDB access
aws dynamodb scan --table-name GothamRiddles --limit 5

# Check API Gateway routes
aws apigatewayv2 get-routes --api-id YOUR_API_ID
```

## Scaling Considerations

### Auto-scaling
- Lambda automatically scales based on requests
- DynamoDB on-demand billing scales automatically
- API Gateway handles high concurrent requests

### Performance Optimization
- Use DynamoDB DAX for caching (if needed)
- Implement connection pooling
- Monitor cold start times

## Security

### Authentication
- JWT tokens validated in each Lambda function
- No direct database access from frontend

### Data Protection
- All data encrypted at rest
- API Gateway provides HTTPS
- IAM roles follow least privilege principle

## Next Steps

1. **Deploy the Lambda functions**
2. **Test all endpoints**
3. **Update frontend to use API Gateway**
4. **Monitor performance and costs**
5. **Set up alerts for errors**

This serverless architecture provides:
- ✅ True serverless scalability
- ✅ Pay-per-use pricing
- ✅ Automatic scaling
- ✅ Built-in monitoring
- ✅ High availability
