# API Integration Verification Script
# Tests all endpoints to ensure frontend can communicate with Lambda backend

param(
    [string]$ApiBaseUrl = "https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod",
    [string]$TestEmail = "test-$(Get-Random)@example.com",
    [string]$TestPassword = "TestPassword123!"
)

$ErrorActionPreference = "Continue"

Write-Host "🧪 API Integration Verification" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "API Base URL: $ApiBaseUrl" -ForegroundColor Yellow
Write-Host ""

$jwtToken = $null
$testsPassed = 0
$testsFailed = 0

# Test 1: User Registration
Write-Host "1️⃣  Testing User Registration..." -ForegroundColor Yellow
try {
    $registerPayload = @{
        email = $TestEmail
        password = $TestPassword
        firstName = "Test"
        lastName = "User"
        username = "testuser$(Get-Random)"
    } | ConvertTo-Json

    $registerResponse = Invoke-WebRequest `
        -Uri "$ApiBaseUrl/api/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $registerPayload `
        -SkipHttpErrorCheck

    if ($registerResponse.StatusCode -eq 200 -or $registerResponse.StatusCode -eq 201) {
        $registerData = $registerResponse.Content | ConvertFrom-Json
        $jwtToken = $registerData.data.jwtToken
        
        if ($jwtToken) {
            Write-Host "   ✅ Registration successful" -ForegroundColor Green
            Write-Host "   Email: $TestEmail" -ForegroundColor Cyan
            Write-Host "   JWT Token: $($jwtToken.Substring(0, 30))..." -ForegroundColor Cyan
            $testsPassed++
        } else {
            Write-Host "   ⚠️  Registration succeeded but no JWT token returned" -ForegroundColor Yellow
            $testsFailed++
        }
    } else {
        Write-Host "   ❌ Registration failed (Status: $($registerResponse.StatusCode))" -ForegroundColor Red
        Write-Host "   Response: $($registerResponse.Content)" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "   ❌ Registration error: $_" -ForegroundColor Red
    $testsFailed++
}

Write-Host ""

# Test 2: User Login (if registration succeeded)
if ($jwtToken) {
    Write-Host "2️⃣  Testing User Login..." -ForegroundColor Yellow
    try {
        $loginPayload = @{
            email = $TestEmail
            password = $TestPassword
        } | ConvertTo-Json

        $loginResponse = Invoke-WebRequest `
            -Uri "$ApiBaseUrl/api/auth/login" `
            -Method POST `
            -ContentType "application/json" `
            -Body $loginPayload `
            -SkipHttpErrorCheck

        if ($loginResponse.StatusCode -eq 200) {
            $loginData = $loginResponse.Content | ConvertFrom-Json
            $loginToken = $loginData.data.jwtToken
            
            if ($loginToken) {
                Write-Host "   ✅ Login successful" -ForegroundColor Green
                Write-Host "   JWT Token: $($loginToken.Substring(0, 30))..." -ForegroundColor Cyan
                $jwtToken = $loginToken
                $testsPassed++
            } else {
                Write-Host "   ⚠️  Login succeeded but no JWT token returned" -ForegroundColor Yellow
                $testsFailed++
            }
        } else {
            Write-Host "   ❌ Login failed (Status: $($loginResponse.StatusCode))" -ForegroundColor Red
            $testsFailed++
        }
    } catch {
        Write-Host "   ❌ Login error: $_" -ForegroundColor Red
        $testsFailed++
    }
    
    Write-Host ""
}

# Test 3: Get Random Riddle
if ($jwtToken) {
    Write-Host "3️⃣  Testing Get Random Riddle..." -ForegroundColor Yellow
    try {
        $riddleResponse = Invoke-WebRequest `
            -Uri "$ApiBaseUrl/riddles/random" `
            -Method GET `
            -Headers @{ Authorization = "Bearer $jwtToken" } `
            -SkipHttpErrorCheck

        if ($riddleResponse.StatusCode -eq 200) {
            $riddleData = $riddleResponse.Content | ConvertFrom-Json
            
            if ($riddleData.data.riddle) {
                Write-Host "   ✅ Random riddle retrieved" -ForegroundColor Green
                Write-Host "   Question: $($riddleData.data.riddle.question.Substring(0, 50))..." -ForegroundColor Cyan
                Write-Host "   Difficulty: $($riddleData.data.riddle.difficulty)" -ForegroundColor Cyan
                $testsPassed++
            } else {
                Write-Host "   ⚠️  Response received but no riddle data" -ForegroundColor Yellow
                $testsFailed++
            }
        } else {
            Write-Host "   ❌ Failed to get riddle (Status: $($riddleResponse.StatusCode))" -ForegroundColor Red
            Write-Host "   Response: $($riddleResponse.Content)" -ForegroundColor Red
            $testsFailed++
        }
    } catch {
        Write-Host "   ❌ Get riddle error: $_" -ForegroundColor Red
        $testsFailed++
    }
    
    Write-Host ""
}

# Test 4: Validate Answer
if ($jwtToken) {
    Write-Host "4️⃣  Testing Validate Answer..." -ForegroundColor Yellow
    try {
        $validatePayload = @{
            riddleId = "test-riddle-123"
            answer = "test-answer"
        } | ConvertTo-Json

        $validateResponse = Invoke-WebRequest `
            -Uri "$ApiBaseUrl/riddles/validate" `
            -Method POST `
            -ContentType "application/json" `
            -Headers @{ Authorization = "Bearer $jwtToken" } `
            -Body $validatePayload `
            -SkipHttpErrorCheck

        if ($validateResponse.StatusCode -eq 200) {
            $validateData = $validateResponse.Content | ConvertFrom-Json
            Write-Host "   ✅ Answer validation endpoint working" -ForegroundColor Green
            Write-Host "   Response: $($validateData.data | ConvertTo-Json)" -ForegroundColor Cyan
            $testsPassed++
        } else {
            Write-Host "   ⚠️  Endpoint responded (Status: $($validateResponse.StatusCode))" -ForegroundColor Yellow
            $testsFailed++
        }
    } catch {
        Write-Host "   ❌ Validate answer error: $_" -ForegroundColor Red
        $testsFailed++
    }
    
    Write-Host ""
}

# Test 5: Get Player Progress
if ($jwtToken) {
    Write-Host "5️⃣  Testing Get Player Progress..." -ForegroundColor Yellow
    try {
        $progressResponse = Invoke-WebRequest `
            -Uri "$ApiBaseUrl/riddles/progress" `
            -Method GET `
            -Headers @{ Authorization = "Bearer $jwtToken" } `
            -SkipHttpErrorCheck

        if ($progressResponse.StatusCode -eq 200) {
            $progressData = $progressResponse.Content | ConvertFrom-Json
            
            if ($progressData.data) {
                Write-Host "   ✅ Player progress retrieved" -ForegroundColor Green
                Write-Host "   Total Score: $($progressData.data.totalScore)" -ForegroundColor Cyan
                Write-Host "   Solved Riddles: $($progressData.data.solvedRiddleIds.Count)" -ForegroundColor Cyan
                $testsPassed++
            } else {
                Write-Host "   ⚠️  Response received but no progress data" -ForegroundColor Yellow
                $testsFailed++
            }
        } else {
            Write-Host "   ❌ Failed to get progress (Status: $($progressResponse.StatusCode))" -ForegroundColor Red
            $testsFailed++
        }
    } catch {
        Write-Host "   ❌ Get progress error: $_" -ForegroundColor Red
        $testsFailed++
    }
    
    Write-Host ""
}

# Summary
Write-Host "================================" -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Passed: $testsPassed" -ForegroundColor Green
Write-Host "❌ Failed: $testsFailed" -ForegroundColor Red
Write-Host ""

if ($testsFailed -eq 0 -and $testsPassed -gt 0) {
    Write-Host "🎉 All tests passed! API integration is working correctly." -ForegroundColor Green
} elseif ($testsPassed -gt 0) {
    Write-Host "⚠️  Some tests failed. Check the errors above." -ForegroundColor Yellow
} else {
    Write-Host "❌ No tests passed. Check your API configuration." -ForegroundColor Red
}

Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Deploy frontend to AWS Amplify (see AMPLIFY_DEPLOYMENT_GUIDE.md)" -ForegroundColor Cyan
Write-Host "2. Set VITE_API_BASE_URL environment variable in Amplify Console" -ForegroundColor Cyan
Write-Host "3. Test all endpoints through the deployed frontend" -ForegroundColor Cyan
