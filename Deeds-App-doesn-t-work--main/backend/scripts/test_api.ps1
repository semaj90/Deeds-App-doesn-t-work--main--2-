# API Testing Script
# This script tests the Rust backend API endpoints

Write-Host "🧪 Testing Prosecutor Backend API..." -ForegroundColor Cyan

$BASE_URL = "http://127.0.0.1:8080"

# Function to make HTTP requests
function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers = @{},
        [string]$Body = $null
    )
    
    try {
        $params = @{
            Method = $Method
            Uri = $Url
            Headers = $Headers
        }
        
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-RestMethod @params
        return $response
    } catch {
        Write-Host "❌ Request failed: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Test 1: Health Check
Write-Host "`n1️⃣ Testing Health Check..." -ForegroundColor Yellow
$health = Invoke-ApiRequest -Method "GET" -Url "$BASE_URL/health"
if ($health) {
    Write-Host "✅ Health check passed!" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Cyan
    Write-Host "   Database: $($health.database)" -ForegroundColor Cyan
} else {
    Write-Host "❌ Health check failed!" -ForegroundColor Red
    exit 1
}

# Test 2: User Registration
Write-Host "`n2️⃣ Testing User Registration..." -ForegroundColor Yellow
$registerData = @{
    email = "test@prosecutor.com"
    password = "secure123"
    first_name = "John"
    last_name = "Prosecutor"
    title = "District Attorney"
    department = "Criminal Division"
} | ConvertTo-Json

$registerResponse = Invoke-ApiRequest -Method "POST" -Url "$BASE_URL/api/auth/register" -Body $registerData
if ($registerResponse) {
    Write-Host "✅ User registration successful!" -ForegroundColor Green
    Write-Host "   User ID: $($registerResponse.user.id)" -ForegroundColor Cyan
    Write-Host "   Email: $($registerResponse.user.email)" -ForegroundColor Cyan
    $TOKEN = $registerResponse.token
} else {
    Write-Host "❌ User registration failed!" -ForegroundColor Red
}

# Test 3: User Login
Write-Host "`n3️⃣ Testing User Login..." -ForegroundColor Yellow
$loginData = @{
    email = "test@prosecutor.com"
    password = "secure123"
} | ConvertTo-Json

$loginResponse = Invoke-ApiRequest -Method "POST" -Url "$BASE_URL/api/auth/login" -Body $loginData
if ($loginResponse) {
    Write-Host "✅ User login successful!" -ForegroundColor Green
    $TOKEN = $loginResponse.token
} else {
    Write-Host "❌ User login failed!" -ForegroundColor Red
}

# Test 4: Get Current User (Protected Route)
if ($TOKEN) {
    Write-Host "`n4️⃣ Testing Protected Route (Get Current User)..." -ForegroundColor Yellow
    $headers = @{ "Authorization" = "Bearer $TOKEN" }
    $userResponse = Invoke-ApiRequest -Method "GET" -Url "$BASE_URL/api/auth/me" -Headers $headers
    if ($userResponse) {
        Write-Host "✅ Protected route access successful!" -ForegroundColor Green
        Write-Host "   Name: $($userResponse.first_name) $($userResponse.last_name)" -ForegroundColor Cyan
        Write-Host "   Role: $($userResponse.role)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Protected route access failed!" -ForegroundColor Red
    }
}

# Test 5: Create a Case
if ($TOKEN) {
    Write-Host "`n5️⃣ Testing Case Creation..." -ForegroundColor Yellow
    $caseData = @{
        case_number = "CASE-2025-TEST-001"
        title = "Test Criminal Case"
        description = "This is a test case for API testing"
        status = "open"
        priority = "high"
        case_type = "criminal"
        jurisdiction = "District Court"
        tags = @("test", "api", "criminal")
        notes = "Created via API test script"
    } | ConvertTo-Json
    
    $headers = @{ "Authorization" = "Bearer $TOKEN" }
    $caseResponse = Invoke-ApiRequest -Method "POST" -Url "$BASE_URL/api/cases" -Headers $headers -Body $caseData
    if ($caseResponse) {
        Write-Host "✅ Case creation successful!" -ForegroundColor Green
        Write-Host "   Case ID: $($caseResponse.id)" -ForegroundColor Cyan
        Write-Host "   Case Number: $($caseResponse.case_number)" -ForegroundColor Cyan
        $CASE_ID = $caseResponse.id
    } else {
        Write-Host "❌ Case creation failed!" -ForegroundColor Red
    }
}

# Test 6: List Cases
if ($TOKEN) {
    Write-Host "`n6️⃣ Testing Case Listing..." -ForegroundColor Yellow
    $headers = @{ "Authorization" = "Bearer $TOKEN" }
    $casesResponse = Invoke-ApiRequest -Method "GET" -Url "$BASE_URL/api/cases" -Headers $headers
    if ($casesResponse) {
        Write-Host "✅ Case listing successful!" -ForegroundColor Green
        Write-Host "   Total cases: $($casesResponse.Count)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Case listing failed!" -ForegroundColor Red
    }
}

# Test 7: Get Specific Case
if ($TOKEN -and $CASE_ID) {
    Write-Host "`n7️⃣ Testing Get Specific Case..." -ForegroundColor Yellow
    $headers = @{ "Authorization" = "Bearer $TOKEN" }
    $caseResponse = Invoke-ApiRequest -Method "GET" -Url "$BASE_URL/api/cases/$CASE_ID" -Headers $headers
    if ($caseResponse) {
        Write-Host "✅ Get case successful!" -ForegroundColor Green
        Write-Host "   Title: $($caseResponse.title)" -ForegroundColor Cyan
        Write-Host "   Status: $($caseResponse.status)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Get case failed!" -ForegroundColor Red
    }
}

Write-Host "`n🎉 API Testing Complete!" -ForegroundColor Green
Write-Host "`n📊 Test Summary:" -ForegroundColor Cyan
Write-Host "   Health Check: ✅" -ForegroundColor Green
Write-Host "   User Registration: $(if ($registerResponse) { '✅' } else { '❌' })" -ForegroundColor $(if ($registerResponse) { 'Green' } else { 'Red' })
Write-Host "   User Login: $(if ($loginResponse) { '✅' } else { '❌' })" -ForegroundColor $(if ($loginResponse) { 'Green' } else { 'Red' })
Write-Host "   Protected Routes: $(if ($userResponse) { '✅' } else { '❌' })" -ForegroundColor $(if ($userResponse) { 'Green' } else { 'Red' })
Write-Host "   Case Management: $(if ($caseResponse) { '✅' } else { '❌' })" -ForegroundColor $(if ($caseResponse) { 'Green' } else { 'Red' })

Write-Host "`n💡 Next steps:" -ForegroundColor Yellow
Write-Host "   - Test file upload endpoints manually" -ForegroundColor Cyan
Write-Host "   - Integrate with Tauri for desktop app" -ForegroundColor Cyan
Write-Host "   - Add more comprehensive test coverage" -ForegroundColor Cyan
