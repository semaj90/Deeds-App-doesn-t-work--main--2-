# Test runner script for Windows PowerShell
# Starts the dev server and runs Playwright tests

Write-Host "🚀 Starting Full Application Test Suite" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Yellow

# Check if server is already running
$serverRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5176" -TimeoutSec 3 -ErrorAction Stop
    $serverRunning = $true
    Write-Host "✅ Server is already running" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Server not running, will start it..." -ForegroundColor Yellow
}

if (-not $serverRunning) {
    Write-Host "🌐 Starting development server..." -ForegroundColor Cyan
    
    # Start the dev server in a new PowerShell window
    $job = Start-Process powershell -ArgumentList "-Command", "cd '$PWD'; npm run dev" -PassThru
    
    Write-Host "⏳ Waiting for server to start..." -ForegroundColor Yellow
    $timeout = 30
    $elapsed = 0
    
    while ($elapsed -lt $timeout) {
        Start-Sleep -Seconds 2
        $elapsed += 2
        
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5176" -TimeoutSec 3 -ErrorAction Stop
            Write-Host "✅ Server is now running!" -ForegroundColor Green
            $serverRunning = $true
            break
        } catch {
            Write-Host "." -NoNewline -ForegroundColor Yellow
        }
    }
    
    if (-not $serverRunning) {
        Write-Host ""
        Write-Host "❌ Server failed to start within $timeout seconds" -ForegroundColor Red
        Write-Host "Please start manually with: npm run dev" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "🎭 Running Playwright E2E Tests..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Yellow

# Run the Playwright tests
try {
    & npx playwright test --reporter=list
    Write-Host "✅ Playwright tests completed!" -ForegroundColor Green
} catch {
    Write-Host "❌ Playwright tests failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Test suite completed!" -ForegroundColor Green
Write-Host "Application is ready at: http://localhost:5176" -ForegroundColor Cyan
