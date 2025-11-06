#!/bin/bash

# Test script for Gotham Cipher Backend Endpoints

set -e

# Configuration
API_URL="https://psqxpuca80.execute-api.ap-southeast-2.amazonaws.com/prod"
REGION="ap-southeast-2"

# Generate JWT token (pre-generated for testing)
echo "🔐 Using pre-generated JWT token..."
JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXBsYXllci0wMDEiLCJyb2xlIjoicGxheWVyIiwiaWF0IjoxNzYyMzM5MjAwLCJleHAiOjE3NjI0MjU2MDAsImF1ZCI6ImdvdGhhbS1jaXBoZXItZnJvbnRlbmQiLCJpc3MiOiJnb3RoYW0tY2lwaGVyLWJhY2tlbmQifQ.gshbm038vCS89ILUh2-29ba3bSmeRclg6Ju2fognj_8"

echo "✅ JWT Token generated: ${JWT_TOKEN:0:50}..."
echo ""

# Test 1: Get Random Riddle
echo "=========================================="
echo "TEST 1: GET /riddles/random"
echo "=========================================="
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/riddles/random?levelId=1" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "Status Code: $HTTP_CODE"
echo "Response:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

# Test 2: Get Player Progress
echo "=========================================="
echo "TEST 2: GET /riddles/progress"
echo "=========================================="
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/riddles/progress" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "Status Code: $HTTP_CODE"
echo "Response:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

# Test 3: Validate Answer
echo "=========================================="
echo "TEST 3: POST /riddles/validate"
echo "=========================================="
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/riddles/validate" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "riddleId": "level-1-riddle-1",
    "answer": "ARKHAM"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "Status Code: $HTTP_CODE"
echo "Response:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

# Test 4: Solve Riddle
echo "=========================================="
echo "TEST 4: POST /riddles/solve"
echo "=========================================="
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/riddles/solve" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "riddleId": "level-1-riddle-1",
    "levelId": 1,
    "stars": 3,
    "completionTime": 45000
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "Status Code: $HTTP_CODE"
echo "Response:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

# Test 5: Check Lambda Function Logs
echo "=========================================="
echo "TEST 5: Checking Lambda Logs"
echo "=========================================="
echo "Checking GetRandomRiddleFunction logs..."
aws logs tail /aws/lambda/GetRandomRiddleFunction --region $REGION --since 1m --format short 2>&1 | tail -20 || echo "No logs available"
echo ""

# Test 6: Check Lambda Function Configuration
echo "=========================================="
echo "TEST 6: Lambda Function Configuration"
echo "=========================================="
echo "GetRandomRiddleFunction:"
aws lambda get-function-configuration \
  --function-name GetRandomRiddleFunction \
  --region $REGION \
  --query '{Runtime, Handler, Role, Environment}' \
  --output json | jq .
echo ""

# Summary
echo "=========================================="
echo "✅ Test Summary"
echo "=========================================="
echo "API URL: $API_URL"
echo "Region: $REGION"
echo "JWT Token: ${JWT_TOKEN:0:50}..."
echo ""
echo "Available Endpoints:"
echo "  GET  /riddles/random?levelId=1"
echo "  GET  /riddles/progress"
echo "  POST /riddles/validate"
echo "  POST /riddles/solve"
echo ""
