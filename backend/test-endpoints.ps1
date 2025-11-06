# Test All API Endpoints
# Tests all riddle and auth endpoints

param(
    [string]$ApiId = "pit5nsq8w0",
    [string]$Region = "ap-southeast-2",
    [string]$StageName = "prod"
)

$BaseUrl = "https://${ApiId}.execute-api.${Region}.amazonaws.com/${StageName}"

Write-Host "🧪 Testing API Endpoints" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl`n" -ForegroundColor Yellow

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Path,
        [string]$Body,
        [string]$Description
    )
    
    Write-Host "📍 $Description" -ForegroundColor Yellow
    Write-Host "   $Method $Path" -ForegroundColor Gray
    
    $url = "$BaseUrl$Path"
    
    try {
        if ($Method -eq "GET") {
            $response = curl -s -w "`n%{http_code}" $url
        } else {
            $response = curl -s -w "`n%{http_code}" -X $Method $url `
                -H "Content-Type: application/json" `
                -d $Body
        }
        
        $statusCode = $response[-1]
        $body = $response[0..($response.Count-2)] -join "`n"
        
        if ($statusCode -eq "200" -or $statusCode -eq "201") {
            Write-Host "   ✅ Status: $statusCode" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Status: $statusCode" -ForegroundColor Yellow
        }
        
        if ($body) {
            Write-Host "   Response: $($body.Substring(0, [Math]::Min(100, $body.Length)))..." -ForegroundColor Cyan
        }
    } catch {
        Write-Host "   ❌ Error: $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

# Riddle Endpoints
Write-Host "`n🎯 Riddle Endpoints:" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

Test-Endpoint -Method "GET" -Path "/riddles/random" -Description "Get Random Riddle"

Test-Endpoint -Method "POST" -Path "/riddles/validate" `
    -Body '{"riddleId":"test","answer":"ARKHAM"}' `
    -Description "Validate Answer"

Test-Endpoint -Method "POST" -Path "/riddles/solve" `
    -Body '{"riddleId":"test","levelId":1,"stars":3,"completionTime":5000}' `
    -Description "Solve Riddle"

Test-Endpoint -Method "GET" -Path "/riddles/progress" -Description "Get Player Progress"

# Auth Endpoints
Write-Host "`n🔐 Auth Endpoints:" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan

$timestamp = Get-Date -UFormat "%s"
$email = "test$timestamp@example.com"
$username = "testuser$timestamp"

Test-Endpoint -Method "POST" -Path "/auth/register" `
    -Body "{`"email`":`"$email`",`"password`":`"TestPass123!`",`"firstName`":`"Test`",`"lastName`":`"User`",`"username`":`"$username`"}" `
    -Description "Register User"

Test-Endpoint -Method "POST" -Path "/auth/login" `
    -Body "{`"email`":`"$email`",`"password`":`"TestPass123!`"}" `
    -Description "Login User"

Test-Endpoint -Method "POST" -Path "/auth/forgot-password" `
    -Body "{`"email`":`"$email`"}" `
    -Description "Forgot Password"

Test-Endpoint -Method "POST" -Path "/auth/reset-password" `
    -Body "{`"email`":`"$email`",`"code`":`"123456`",`"newPassword`":`"NewPass123!`"}" `
    -Description "Reset Password"

Write-Host "========================" -ForegroundColor Cyan
Write-Host "✅ Testing Complete" -ForegroundColor Green
