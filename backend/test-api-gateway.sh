#!/bin/bash

# Test API Gateway Endpoints
# Usage: bash test-api-gateway.sh <api-id> [region] [stage]

API_ID=${1:-pit5nsq8w0}
REGION=${2:-ap-southeast-2}
STAGE=${3:-prod}
BASE_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE}"

echo "🧪 Testing API Gateway Endpoints"
echo "=================================="
echo "Base URL: $BASE_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
  local method=$1
  local path=$2
  local data=$3
  local description=$4
  
  echo -e "${YELLOW}Testing:${NC} $description"
  echo "  Method: $method"
  echo "  Path: $path"
  
  if [ -z "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$path" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json")
  else
    response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$path" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      -d "$data")
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    echo -e "  ${GREEN}✅ Status: $http_code${NC}"
  else
    echo -e "  ${RED}❌ Status: $http_code${NC}"
  fi
  
  echo "  Response: $body"
  echo ""
}

# Test 1: Health Check (if endpoint exists)
echo "📋 Test 1: Health Check"
test_endpoint "GET" "/health" "" "GET /health"

# Test 2: Get Random Riddle (no auth required for testing)
echo "📋 Test 2: Get Random Riddle"
test_endpoint "GET" "/riddles/random" "" "GET /riddles/random"

# Test 3: Validate Answer
echo "📋 Test 3: Validate Answer"
test_endpoint "POST" "/riddles/validate" \
  '{"riddleId":"test-riddle","answer":"test-answer"}' \
  "POST /riddles/validate"

# Test 4: Solve Riddle
echo "📋 Test 4: Solve Riddle"
test_endpoint "POST" "/riddles/solve" \
  '{"riddleId":"test-riddle","levelId":1,"stars":3,"completionTime":5000}' \
  "POST /riddles/solve"

# Test 5: Get Player Progress
echo "📋 Test 5: Get Player Progress"
test_endpoint "GET" "/riddles/progress" "" "GET /riddles/progress"

# Test 6: Auth Endpoints
echo "📋 Test 6: Register User"
test_endpoint "POST" "/auth/register" \
  '{"email":"test@example.com","password":"TestPass123!","firstName":"Test","lastName":"User","username":"testuser"}' \
  "POST /auth/register"

echo "📋 Test 7: Login User"
test_endpoint "POST" "/auth/login" \
  '{"email":"test@example.com","password":"TestPass123!"}' \
  "POST /auth/login"

echo "📋 Test 8: Forgot Password"
test_endpoint "POST" "/auth/forgot-password" \
  '{"email":"test@example.com"}' \
  "POST /auth/forgot-password"

echo "📋 Test 9: Reset Password"
test_endpoint "POST" "/auth/reset-password" \
  '{"email":"test@example.com","code":"123456","newPassword":"NewPass123!"}' \
  "POST /auth/reset-password"

echo "=================================="
echo "✅ Testing complete!"
echo ""
echo "📊 Summary:"
echo "- 200/201 responses = Endpoint is working"
echo "- 404 responses = Route not found or not deployed"
echo "- 500 responses = Lambda execution error (check CloudWatch logs)"
echo ""
echo "🔍 To debug further:"
echo "1. Check CloudWatch logs: aws logs tail /aws/lambda --follow --region $REGION"
echo "2. Check API Gateway routes: aws apigatewayv2 get-routes --api-id $API_ID --region $REGION"
echo "3. Check Lambda permissions: aws lambda get-policy --function-name GetRandomRiddleFunction --region $REGION"
echo ""
