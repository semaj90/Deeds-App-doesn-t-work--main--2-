# Local AI Prosecutor System Test Setup
Write-Host "Testing Local AI Prosecutor System..." -ForegroundColor Cyan

# Test 1: Check services
Write-Host "`n1. Checking Services..." -ForegroundColor Yellow

# Check if Docker is running
Write-Host "  PostgreSQL:" -NoNewline
try {
    $result = docker ps --filter "ancestor=ankane/pgvector" --format "{{.Names}}" 2>$null
    if ($result) {
        Write-Host " Running" -ForegroundColor Green
    } else {
        Write-Host " Not Running" -ForegroundColor Red
        Write-Host "     Run: docker-compose up -d db" -ForegroundColor Gray
    }
} catch {
    Write-Host " Docker not available" -ForegroundColor Red
}

Write-Host "  Qdrant:" -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:6333/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host " Running" -ForegroundColor Green
    } else {
        Write-Host " Not Running" -ForegroundColor Red
    }
} catch {
    Write-Host " Not Running" -ForegroundColor Red
    Write-Host "     Run: docker-compose up -d qdrant" -ForegroundColor Gray
}

# Test 2: Check Rust Backend
Write-Host "`n2. Testing Rust Backend..." -ForegroundColor Yellow

if (Test-Path ".\backend\Cargo.toml") {
    Write-Host "  Cargo.toml: Found" -ForegroundColor Green
} else {
    Write-Host "  Cargo.toml: Not found" -ForegroundColor Red
}

# Test 3: Check environment
Write-Host "`n3. Environment..." -ForegroundColor Yellow

if (Test-Path ".\backend\.env") {
    Write-Host "  Environment file: Found" -ForegroundColor Green
} else {
    Write-Host "  Environment file: Not found" -ForegroundColor Red
    Write-Host "     Create: copy backend\.env.example backend\.env" -ForegroundColor Gray
}

if (Test-Path ".\backend\models") {
    $models = Get-ChildItem ".\backend\models" -Filter "*.gguf" | Measure-Object
    if ($models.Count -gt 0) {
        Write-Host "  AI Models: Found $($models.Count) GGUF models" -ForegroundColor Green
    } else {
        Write-Host "  AI Models: No GGUF models found" -ForegroundColor Yellow
        Write-Host "     Download: .\backend\scripts\download_model.ps1" -ForegroundColor Gray
    }
} else {
    Write-Host "  Models directory: Not found" -ForegroundColor Red
    Write-Host "     Create: mkdir backend\models" -ForegroundColor Gray
}

# Summary
Write-Host "`nNext Steps:" -ForegroundColor Green
Write-Host "  1. Start services: docker-compose up -d" -ForegroundColor White
Write-Host "  2. Download model: .\backend\scripts\download_model.ps1" -ForegroundColor White
Write-Host "  3. Start backend: cd backend && .\scripts\dev.ps1" -ForegroundColor White
Write-Host "  4. Test API: .\backend\scripts\test_api.ps1" -ForegroundColor White

Write-Host "`nReady for AI-powered legal case management!" -ForegroundColor Cyan
