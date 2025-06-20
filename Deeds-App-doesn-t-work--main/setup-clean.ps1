c# Multimodal Legal NLP/LLM Setup Script
# This script sets up the complete multimodal pipeline for the Deeds app

param(
    [switch]$SkipPython,
    [switch]$SkipRust,
    [switch]$SkipDocker,
    [switch]$Quick
)

$ErrorActionPreference = "Continue"

Write-Host "=======================================" -ForegroundColor Magenta
Write-Host "Multimodal Legal NLP/LLM Setup" -ForegroundColor Magenta
Write-Host "=======================================" -ForegroundColor Magenta
Write-Host ""

# Step 1: Python Dependencies
if (-not $SkipPython) {
    Write-Host "Step 1: Setting up Python NLP Service" -ForegroundColor Yellow
    
    # Check if python-nlp-service directory exists
    if (-not (Test-Path "python-nlp-service")) {
        Write-Host "Creating python-nlp-service directory..." -ForegroundColor Cyan
        New-Item -ItemType Directory -Path "python-nlp-service" -Force
    }
    
    Set-Location "python-nlp-service"
    
    # Install Python dependencies
    if (Test-Path "requirements.txt") {
        Write-Host "Installing Python dependencies..." -ForegroundColor Cyan
        python -m pip install --upgrade pip
        python -m pip install -r requirements.txt
        Write-Host "Python dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "WARNING: requirements.txt not found" -ForegroundColor Red
    }
    
    Set-Location ".."
}

# Step 2: Rust Dependencies
if (-not $SkipRust) {
    Write-Host "Step 2: Setting up Rust Backend" -ForegroundColor Yellow
    
    # Check if src-tauri exists
    if (Test-Path "src-tauri") {
        Set-Location "src-tauri"
        
        # Update Cargo.toml with multimodal dependencies
        $cargoToml = "Cargo.toml"
        if (Test-Path $cargoToml) {
            $cargoContent = Get-Content $cargoToml -Raw
            
            $additionalDeps = @"
reqwest = { version = "0.11", features = ["json", "multipart"] }
tokio = { version = "1.0", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
opencv = { version = "0.88", features = ["opencv-4"] }
image = "0.24"
base64 = "0.21"
uuid = { version = "1.0", features = ["v4"] }
"@
            
            if ($cargoContent -notlike "*reqwest*") {
                Write-Host "Adding multimodal dependencies to Cargo.toml..." -ForegroundColor Cyan
                $cargoContent = $cargoContent -replace "\[dependencies\]", "[dependencies]`n$additionalDeps"
                Set-Content $cargoToml -Value $cargoContent
            }
        }
        
        Set-Location ".."
        Write-Host "Rust dependencies configured" -ForegroundColor Green
    }
}

# Step 3: Qdrant Vector Database
if (-not $SkipDocker) {
    Write-Host "Step 3: Setting up Qdrant Vector Database" -ForegroundColor Yellow
    
    # Check if Docker is available
    try {
        $dockerVersion = docker --version 2>$null
        if ($dockerVersion) {
            Write-Host "Docker found: $dockerVersion" -ForegroundColor Cyan
            
            # Check if Qdrant is already running
            $qdrantRunning = docker ps --filter "name=qdrant" --format "table {{.Names}}" 2>$null
            if ($qdrantRunning -like "*qdrant*") {
                Write-Host "Qdrant is already running" -ForegroundColor Green
            } else {
                Write-Host "Starting Qdrant container..." -ForegroundColor Cyan
                $currentPath = Get-Location
                docker run -d --name qdrant -p 6333:6333 -p 6334:6334 -v "${currentPath}/qdrant_storage:/qdrant/storage:z" qdrant/qdrant
                Start-Sleep -Seconds 5
                Write-Host "Qdrant started on http://localhost:6333" -ForegroundColor Green
            }
        } else {
            Write-Host "Docker not found. Please install Docker to use Qdrant" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Docker not available. Qdrant setup skipped" -ForegroundColor Yellow
    }
}

# Step 4: Environment Configuration
Write-Host "Step 4: Setting up Environment Configuration" -ForegroundColor Yellow

# Create .env file for Python service
$pythonEnvPath = "python-nlp-service\.env"
if (-not (Test-Path $pythonEnvPath)) {
    $pythonEnvContent = @"
# Python NLP Service Configuration
OLLAMA_BASE_URL=http://localhost:11434
HUGGING_FACE_HUB_TOKEN=
MODEL_CACHE_DIR=./models
USER_MODEL_DIR=./user_models
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
MAX_VIDEO_DURATION=300
ENABLE_MULTIMODAL_ANALYSIS=true
"@
    Set-Content $pythonEnvPath -Value $pythonEnvContent
    Write-Host "Created Python .env file" -ForegroundColor Green
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
    Write-Host "Created SvelteKit .env file" -ForegroundColor Green
}

# Step 5: Database Setup
Write-Host "Step 5: Setting up Database" -ForegroundColor Yellow

if (Test-Path "web-app\sveltekit-frontend") {
    Set-Location "web-app\sveltekit-frontend"
    
    # Install dependencies if not done
    if (Test-Path "package.json" -and -not (Test-Path "node_modules")) {
        Write-Host "Installing SvelteKit dependencies..." -ForegroundColor Cyan
        npm install
    }
    
    # Run database migrations
    if (Test-Path "drizzle.config.ts") {
        Write-Host "Running database migrations..." -ForegroundColor Cyan
        npx drizzle-kit push:sqlite
        Write-Host "Database migrations completed" -ForegroundColor Green
    }
    
    Set-Location "..\..\"
}

# Step 6: Verification
Write-Host "Step 6: Verification" -ForegroundColor Yellow

$allGood = $true

# Check Python service
if (Test-Path "python-nlp-service\main.py") {
    Write-Host "Python NLP service found" -ForegroundColor Green
} else {
    Write-Host "Python NLP service missing" -ForegroundColor Red
    $allGood = $false
}

# Check Rust backend
if (Test-Path "src-tauri\src\main.rs") {
    Write-Host "Rust Tauri backend found" -ForegroundColor Green
} else {
    Write-Host "Rust Tauri backend missing" -ForegroundColor Red
    $allGood = $false
}

# Check SvelteKit frontend
if (Test-Path "web-app\sveltekit-frontend\src\app.html") {
    Write-Host "SvelteKit frontend found" -ForegroundColor Green
} else {
    Write-Host "SvelteKit frontend missing" -ForegroundColor Red
    $allGood = $false
}

# Check database
if ((Test-Path "dev.db") -or (Test-Path "web-app\sveltekit-frontend\dev.db")) {
    Write-Host "Database found" -ForegroundColor Green
} else {
    Write-Host "Database missing" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""
if ($allGood) {
    Write-Host "Setup completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Setup completed with some issues" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Magenta
Write-Host "Next Steps:" -ForegroundColor Magenta
Write-Host "=======================================" -ForegroundColor Magenta
Write-Host "1. Upload your GGUF models to user_models/ directory" -ForegroundColor Cyan
Write-Host "2. Run the test script: .\test-multimodal.ps1" -ForegroundColor Cyan
Write-Host "3. Start the development servers:" -ForegroundColor Cyan
Write-Host "   - Python: cd python-nlp-service; python main.py" -ForegroundColor Cyan
Write-Host "   - SvelteKit: cd web-app\sveltekit-frontend; npm run dev" -ForegroundColor Cyan
Write-Host "   - Tauri (desktop): npm run tauri dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "- Python service: http://localhost:8001" -ForegroundColor Cyan
Write-Host "- Qdrant: http://localhost:6333" -ForegroundColor Cyan
Write-Host "- SvelteKit: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "- Check COMPLETE_MULTIMODAL_IMPLEMENTATION.md for detailed usage" -ForegroundColor Cyan
Write-Host "- See USER_MODEL_REQUIREMENTS.md for model upload instructions" -ForegroundColor Cyan
Write-Host ""
Write-Host "Important: This system only uses user-provided models." -ForegroundColor Red
Write-Host "No models are downloaded automatically for security reasons." -ForegroundColor Red
