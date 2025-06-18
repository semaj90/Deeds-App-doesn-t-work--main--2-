# Local AI Prosecutor System Test Setup
# This script tests the complete AI-powered stack

Write-Host "Testing Local AI Prosecutor System..." -ForegroundColor Cyan

# Test 1: Check if required services are running
Write-Host "`n1. Checking Services..." -ForegroundColor Yellow

# Check PostgreSQL
Write-Host "  [DB] PostgreSQL:" -NoNewline
try {
    $pgTest = docker ps --filter "ancestor=ankane/pgvector" --format "table {{.Names}}\t{{.Status}}"
    if ($pgTest) {
        Write-Host " ✅ Running" -ForegroundColor Green
    } else {
        Write-Host " ❌ Not Running" -ForegroundColor Red
        Write-Host "     Run: docker-compose up -d db" -ForegroundColor Gray
    }
} catch {
    Write-Host " ❌ Docker not available" -ForegroundColor Red
}

# Check Qdrant
Write-Host "  🔍 Qdrant:" -NoNewline
try {
    $qdrantTest = Invoke-RestMethod -Uri "http://localhost:6333/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($qdrantTest) {
        Write-Host " ✅ Running" -ForegroundColor Green
    } else {
        Write-Host " ❌ Not Running" -ForegroundColor Red
        Write-Host "     Run: docker-compose up -d qdrant" -ForegroundColor Gray
    }
} catch {
    Write-Host " ❌ Not Running" -ForegroundColor Red
}

# Test 2: Check Rust Backend
Write-Host "`n2. Testing Rust Backend..." -ForegroundColor Yellow

if (Test-Path ".\backend\Cargo.toml") {
    Write-Host "  🦀 Cargo.toml: ✅ Found" -ForegroundColor Green
    
    # Check if it compiles
    Write-Host "  🔧 Compilation:" -NoNewline
    $compileResult = cargo check --manifest-path .\backend\Cargo.toml 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✅ Compiles" -ForegroundColor Green
    } else {
        Write-Host " ❌ Compilation errors" -ForegroundColor Red
        Write-Host "     Check: cargo check in backend/" -ForegroundColor Gray
    }
} else {
    Write-Host "  🦀 Backend: ❌ Not found" -ForegroundColor Red
}

# Test 3: Check AI Dependencies
Write-Host "`n3. Checking AI Setup..." -ForegroundColor Yellow

Write-Host "  📁 Models Directory:" -NoNewline
if (Test-Path ".\backend\models") {
    $modelFiles = Get-ChildItem ".\backend\models" -Filter "*.gguf" | Measure-Object
    if ($modelFiles.Count -gt 0) {
        Write-Host " ✅ Found $($modelFiles.Count) GGUF model(s)" -ForegroundColor Green
    } else {
        Write-Host " ⚠️  Directory exists but no GGUF models" -ForegroundColor Yellow
        Write-Host "     Download models from Hugging Face" -ForegroundColor Gray
    }
} else {
    Write-Host " ❌ Not found" -ForegroundColor Red
    Write-Host "     Create: mkdir backend\models" -ForegroundColor Gray
}

Write-Host "  📄 Environment:" -NoNewline
if (Test-Path ".\backend\.env") {
    $envContent = Get-Content ".\backend\.env" -Raw
    if ($envContent -match "LOCAL_LLM_MODEL_PATH" -and $envContent -match "QDRANT_URL") {
        Write-Host " ✅ Configured" -ForegroundColor Green
    } else {
        Write-Host " ⚠️  Incomplete configuration" -ForegroundColor Yellow
    }
} else {
    Write-Host " ❌ Not found" -ForegroundColor Red
    Write-Host "     Copy: copy .env.example .env" -ForegroundColor Gray
}

# Test 4: Check File Processing
Write-Host "`n4. File Processing Capabilities..." -ForegroundColor Yellow

$uploadDir = ".\backend\uploads"
Write-Host "  [FOLDER] Upload Directory:" -NoNewline
if (Test-Path $uploadDir) {
    Write-Host " ✅ Ready" -ForegroundColor Green
} else {
    Write-Host " ⚠️  Will be created on first upload" -ForegroundColor Yellow
}

# Test 5: Database Schema
Write-Host "`n5. Database Schema..." -ForegroundColor Yellow
Write-Host "  🗄️  Tables: Will be created by migrations" -ForegroundColor Gray
Write-Host "  🤖 AI Columns: ai_tags, ai_summary, embeddings_indexed" -ForegroundColor Gray

# Test 6: API Endpoints Preview
Write-Host "`n6. API Endpoints (when running)..." -ForegroundColor Yellow
Write-Host "  📤 Evidence Upload: POST /api/evidence/upload" -ForegroundColor Gray
Write-Host "  🔍 Semantic Search: GET /api/evidence/search?q=..." -ForegroundColor Gray
Write-Host "  🔗 Similar Evidence: GET /api/evidence/{id}/similar" -ForegroundColor Gray
Write-Host "  📊 System Stats: GET /api/evidence/stats" -ForegroundColor Gray
Write-Host "  🏥 Health Check: GET /api/health" -ForegroundColor Gray

# Summary
Write-Host "`n🎯 Next Steps:" -ForegroundColor Green
Write-Host "  1. Start services: docker-compose up -d" -ForegroundColor White
Write-Host "  2. Download a model: Place GGUF file in backend/models/" -ForegroundColor White
Write-Host "  3. Configure backend: Update backend/.env" -ForegroundColor White
Write-Host "  4. Start Rust API: cd backend && .\scripts\dev.ps1" -ForegroundColor White
Write-Host "  5. Start SvelteKit: npm run dev" -ForegroundColor White
Write-Host "  6. Test API: .\backend\scripts\test_api.ps1" -ForegroundColor White

Write-Host "`n📚 Documentation:" -ForegroundColor Blue
Write-Host "  📖 Setup Guide: LOCAL_AI_SETUP_GUIDE.md" -ForegroundColor White
Write-Host "  🔧 Database Guide: DATABASE_GUIDE.md" -ForegroundColor White
Write-Host "  🦀 Rust Backend: Rust_Backend_Development_Plan.md" -ForegroundColor White

Write-Host "`n🚀 System Ready for AI-Powered Legal Case Management! ⚖️" -ForegroundColor Cyan
