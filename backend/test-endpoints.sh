#!/bin/bash

# Gotham Cipher Backend - API Endpoint Testing Script
# Usage: bash test-endpoints.sh <API_GATEWAY_URL>

set -e

if [ -z "$1" ]; then
    echo "❌ Error: API Gateway URL is required"
    echo "Usage: bash test-endpoints.sh <API_GATEWAY_URL>"
    echo "Example: bash test-endpoints.sh https://abc123.execute-api.ap-southeast-2.amazonaws.com/prod"
    exit 1
fi

API_URL="$1"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="TestPassword123!"
TEST_USERNAME="testuser"
TEST_FIRST_NAME="Test"
TEST_LAST_NAME="User"

echo "🦇 Gotham Cipher Backend - API Testing"
echo "======================================"
echo "API URL: $API_URL"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5
    
    echo ""
    echo -e "${YELLOW}Testing:${NC} $description"
    echo "  Method: $method"
    echo "  Endpoint: $endpoint"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            "$API_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASSED${NC} (HTTP $http_code)"
        echo "  Response: $body"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo "$body"
    else
        echo -e "${RED}❌ FAILED${NC} (Expected HTTP $expected_status, got $http_code)"
        echo "  Response: $body"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Test 1: Register User
echo ""
echo "=== Authentication Tests ==="
REGISTER_DATA="{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"firstName\":\"$TEST_FIRST_NAME\",\"lastName\":\"$TEST_LAST_NAME\",\"username\":\"$TEST_USERNAME\"}"
test_endpoint "POST" "/auth/register" "$REGISTER_DATA" "201" "User Registration"

# Extract JWT token from login (we'll use a mock token for now)
# In real scenario, you'd parse the response and extract the token

# Test 2: Login User
LOGIN_DATA="{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}"
LOGIN_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$LOGIN_DATA" \
    "$API_URL/auth/login")

JWT_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"jwtToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$JWT_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  Warning: Could not extract JWT token from login response${NC}"
    echo "Response: $LOGIN_RESPONSE"
    JWT_TOKEN="mock-jwt-token"
else
    echo -e "${GREEN}✅ JWT Token extracted successfully${NC}"
fi

# Test 3: Forgot Password
FORGOT_DATA="{\"email\":\"$TEST_EMAIL\"}"
test_endpoint "POST" "/auth/forgot-password" "$FORGOT_DATA" "200" "Forgot Password Request"

# Test 4: Fetch Random Riddle (requires auth)
echo ""
echo "=== Riddle Tests ==="
test_endpoint "GET" "/riddles/random?levelId=1&difficulty=easy" "" "200" "Fetch Random Riddle"

# Test 5: Validate Answer (requires auth)
VALIDATE_DATA="{\"riddleId\":\"level-1-riddle-1\",\"answer\":\"ARKHAM\"}"
test_endpoint "POST" "/riddles/validate" "$VALIDATE_DATA" "200" "Validate Riddle Answer"

# Test 6: Solve Riddle (requires auth)
SOLVE_DATA="{\"riddleId\":\"level-1-riddle-1\",\"levelId\":1,\"stars\":3,\"completionTime\":45000}"
test_endpoint "POST" "/riddles/solve" "$SOLVE_DATA" "200" "Solve Riddle"

# Test 7: Get Player Progress (requires auth)
test_endpoint "GET" "/riddles/progress" "" "200" "Get Player Progress"

# Test Summary
echo ""
echo "=== Test Summary ==="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the output above.${NC}"
    exit 1
fi
