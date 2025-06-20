# Multimodal Legal Scene Understanding Setup Script
# Sets up the complete stack: Rust + Python + SvelteKit + Qdrant

Write-Host "🚀 Setting up Multimodal Legal Scene Understanding System" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Step 1: Installing Python Dependencies" -ForegroundColor Yellow
# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.8+ first." -ForegroundColor Red
    exit 1
}

# Set up Python virtual environment
if (-not (Test-Path "python-nlp-service\venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Cyan
    Set-Location python-nlp-service
    python -m venv venv
    Set-Location ..
}

# Activate virtual environment and install packages
Write-Host "Installing Python packages..." -ForegroundColor Cyan
$activateScript = "python-nlp-service\venv\Scripts\Activate.ps1"
if (Test-Path $activateScript) {
    & $activateScript
    Set-Location python-nlp-service
    pip install -r requirements.txt
    Set-Location ..
    deactivate
} else {
    Write-Host "⚠️  Warning: Could not activate virtual environment. Installing globally..." -ForegroundColor Yellow
    Set-Location python-nlp-service
    pip install -r requirements.txt
    Set-Location ..
}

Write-Host "🦀 Step 2: Setting up Rust Dependencies" -ForegroundColor Yellow
# Check if Rust is available
try {
    $rustVersion = rustc --version 2>&1
    Write-Host "✅ Rust found: $rustVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Rust not found. Please install Rust first: https://rustup.rs/" -ForegroundColor Red
    exit 1
}

# Check if ffmpeg is available
try {
    $ffmpegVersion = ffmpeg -version 2>&1 | Select-Object -First 1
    Write-Host "✅ FFmpeg found: $ffmpegVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Warning: FFmpeg not found. Video processing will be limited." -ForegroundColor Yellow
    Write-Host "Install FFmpeg from: https://ffmpeg.org/download.html" -ForegroundColor Yellow
}

# Update Cargo.toml for multimodal dependencies
Write-Host "Adding Rust dependencies..." -ForegroundColor Cyan
$cargoToml = "src-tauri\Cargo.toml"
if (Test-Path $cargoToml) {
    # Add multimodal dependencies to Cargo.toml
    $cargoContent = Get-Content $cargoToml -Raw
    
    $additionalDeps = @"
# Multimodal processing dependencies
tokio = { version = "1.0", features = ["full"] }
reqwest = { version = "0.11", features = ["json"] }
serde_json = "1.0"
opencv = { version = "0.88", optional = true }
image = "0.24"
"@
    
    if ($cargoContent -notlike "*reqwest*") {
        Write-Host "Adding multimodal dependencies to Cargo.toml..." -ForegroundColor Cyan
        $cargoContent = $cargoContent -replace "\[dependencies\]", "[dependencies]`n$additionalDeps"
        Set-Content $cargoToml -Value $cargoContent
    }
}

Write-Host "🗄️ Step 3: Setting up Qdrant Vector Database" -ForegroundColor Yellow
# Check if Docker is available
try {
    $dockerVersion = docker --version 2>&1
    Write-Host "✅ Docker found: $dockerVersion" -ForegroundColor Green
    
    # Check if Qdrant container is running
    $qdrantContainer = docker ps --filter "name=qdrant" --format "{{.Names}}" 2>$null
    
    if ($qdrantContainer -eq "qdrant") {
        Write-Host "✅ Qdrant container already running" -ForegroundColor Green
    } else {
        Write-Host "Starting Qdrant container..." -ForegroundColor Cyan
        docker run -d --name qdrant -p 6333:6333 -p 6334:6334 qdrant/qdrant:latest
        Start-Sleep 5
        Write-Host "✅ Qdrant started on http://localhost:6333" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Warning: Docker not found. You'll need to install Qdrant manually." -ForegroundColor Yellow
    Write-Host "Alternative: Install Qdrant locally from: https://qdrant.tech/documentation/quick-start/" -ForegroundColor Yellow
}

Write-Host "🌐 Step 4: Setting up SvelteKit Frontend" -ForegroundColor Yellow
# Install Node.js dependencies
if (Test-Path "web-app\sveltekit-frontend\package.json") {
    Write-Host "Installing Node.js dependencies..." -ForegroundColor Cyan
    Set-Location web-app\sveltekit-frontend
    npm install
    Set-Location ..\..
} else {
    Write-Host "⚠️  Warning: SvelteKit frontend package.json not found" -ForegroundColor Yellow
}

Write-Host "📁 Step 5: Creating Directory Structure" -ForegroundColor Yellow
# Create necessary directories
$directories = @(
    "evidence_storage",
    "models",
    "ai_models", 
    "python-nlp-service\models",
    "python-nlp-service\evidence_storage"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✅ Created directory: $dir" -ForegroundColor Green
    }
}

Write-Host "⚙️ Step 6: Creating Environment Configuration" -ForegroundColor Yellow
# Create .env file for Python service
$pythonEnvPath = "python-nlp-service\.env"
if (-not (Test-Path $pythonEnvPath)) {
    $pythonEnvContent = @"
# Python NLP Service Configuration
LLM_MODEL_PATH=
SENTENCE_MODEL=all-MiniLM-L6-v2
MODELS_DIR=./models
EVIDENCE_STORAGE_PATH=./evidence_storage
AI_MODELS_PATH=./ai_models
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
MAX_VIDEO_DURATION=300
ENABLE_MULTIMODAL_ANALYSIS=true
"@
    Set-Content $pythonEnvPath -Value $pythonEnvContent
    Write-Host "✅ Created Python .env file" -ForegroundColor Green
}

# Create .env file for SvelteKit
$svelteEnvPath = "web-app\sveltekit-frontend\.env"
if (-not (Test-Path $svelteEnvPath)) {
    $svelteEnvContent = @"
# SvelteKit Configuration
PYTHON_NLP_SERVICE_URL=http://localhost:8001
RUST_TAURI_SERVICE_URL=http://localhost:3000
QDRANT_URL=http://localhost:6333
"@
    Set-Content $svelteEnvPath -Value $svelteEnvContent
    Write-Host "✅ Created SvelteKit .env file" -ForegroundColor Green
}

Write-Host "🔧 Step 7: Database Migration" -ForegroundColor Yellow
# Run database migrations for multimodal tables
if (Test-Path "web-app\sveltekit-frontend\package.json") {
    Set-Location web-app\sveltekit-frontend
    Write-Host "Running database migrations..." -ForegroundColor Cyan
    npm run db:push 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database migrations completed" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Warning: Database migration failed. You may need to run it manually." -ForegroundColor Yellow
    }
    Set-Location ..\..
}

Write-Host "🧪 Step 8: Testing Components" -ForegroundColor Yellow
# Test Python service
Write-Host "Testing Python NLP service..." -ForegroundColor Cyan
$pythonTestScript = @"
import sys
import os
sys.path.append('python-nlp-service')

try:
    # Test basic imports
    import fastapi
    import uvicorn
    print('✅ FastAPI available')
    
    # Test ML libraries
    try:
        import torch
        print('✅ PyTorch available')
    except ImportError:
        print('⚠️  PyTorch not available')
    
    try:
        import cv2
        print('✅ OpenCV available')
    except ImportError:
        print('⚠️  OpenCV not available')
    
    try:
        from ultralytics import YOLO
        print('✅ YOLO available')
    except ImportError:
        print('⚠️  YOLO not available')
    
    try:
        import whisper
        print('✅ Whisper available')
    except ImportError:
        print('⚠️  Whisper not available')
    
    try:
        import qdrant_client
        print('✅ Qdrant client available')
    except ImportError:
        print('⚠️  Qdrant client not available')
    
    print('Python service dependencies check completed')
    
except Exception as e:
    print(f'❌ Python service test failed: {e}')
"@

$pythonTestScript | python 2>$null

Write-Host "🎯 Step 9: Creating Test Scripts" -ForegroundColor Yellow
# Create test evidence processing script
$testScriptPath = "test-multimodal.ps1"
$testScriptContent = @"
# Test Multimodal Evidence Processing
Write-Host "🧪 Testing Multimodal Evidence Processing" -ForegroundColor Green

# Start Python NLP service
Write-Host "Starting Python NLP service..." -ForegroundColor Cyan
Start-Job -Name "PythonService" -ScriptBlock {
    Set-Location python-nlp-service
    if (Test-Path "venv\Scripts\Activate.ps1") {
        & "venv\Scripts\Activate.ps1"
    }
    python main.py
}

Start-Sleep 5

# Test API endpoints
Write-Host "Testing API endpoints..." -ForegroundColor Cyan
try {
    `$response = Invoke-RestMethod -Uri "http://localhost:8001/health" -Method GET
    if (`$response.status -eq "healthy") {
        Write-Host "✅ Python NLP service is running" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Python NLP service not responding" -ForegroundColor Red
}

# Test Qdrant connection
try {
    `$qdrantResponse = Invoke-RestMethod -Uri "http://localhost:6333/collections" -Method GET
    Write-Host "✅ Qdrant is accessible" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Qdrant not accessible" -ForegroundColor Yellow
}

Write-Host "Test completed. Check the output above for any issues." -ForegroundColor Cyan
Write-Host "To stop the test services, run: Stop-Job -Name 'PythonService'" -ForegroundColor Yellow
"@

Set-Content $testScriptPath -Value $testScriptContent
Write-Host "✅ Created test script: $testScriptPath" -ForegroundColor Green

Write-Host "" -ForegroundColor White
Write-Host "🎉 Multimodal Legal Scene Understanding Setup Complete!" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Upload your GGUF models to the 'models' directory" -ForegroundColor Cyan
Write-Host "2. Run the test script: .\test-multimodal.ps1" -ForegroundColor Cyan
Write-Host "3. Start the development servers:" -ForegroundColor Cyan
Write-Host "   - Python: cd python-nlp-service && python main.py" -ForegroundColor Cyan
Write-Host "   - SvelteKit: cd web-app\sveltekit-frontend && npm run dev" -ForegroundColor Cyan
Write-Host "   - Tauri (desktop): npm run tauri dev" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "🔧 Configuration:" -ForegroundColor Yellow
Write-Host "- Python service: http://localhost:8001" -ForegroundColor Cyan
Write-Host "- Qdrant: http://localhost:6333" -ForegroundColor Cyan
Write-Host "- SvelteKit: http://localhost:5173" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "- Check COMPLETE_NLP_IMPLEMENTATION.md for detailed usage" -ForegroundColor Cyan
Write-Host "- See USER_MODEL_REQUIREMENTS.md for model upload instructions" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "⚠️  Important: This system only uses user-provided models." -ForegroundColor Red
Write-Host "   No models are downloaded automatically for security reasons." -ForegroundColor Red
