# Development Setup Script for Enhanced Legal NLP Application
# Run this to set up the complete development environment

Write-Host "=== IMPORTANT: USER MODEL REQUIREMENT ===" -ForegroundColor Red -BackgroundColor Yellow
Write-Host "This application does NOT include, download, or provide any LLM models." -ForegroundColor Red
Write-Host "For local LLM features, you must provide your own GGUF models." -ForegroundColor Red
Write-Host "See documentation for model sources and requirements." -ForegroundColor Red
Write-Host "=======================================" -ForegroundColor Red -BackgroundColor Yellow
Write-Host ""

Write-Host "Setting up Enhanced Legal NLP Application..." -ForegroundColor Green

# Check Node.js version
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Node.js not found. Please install Node.js 18 or later." -ForegroundColor Red
    exit 1
}
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Blue

# Check Python version
$pythonVersion = python --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Python not found. Please install Python 3.8 or later." -ForegroundColor Red
    exit 1
}
Write-Host "Python version: $pythonVersion" -ForegroundColor Blue

# Setup Web App
Write-Host "`nSetting up SvelteKit Web Application..." -ForegroundColor Yellow
Set-Location "web-app/sveltekit-frontend"

# Install dependencies
Write-Host "Installing Node.js dependencies..." -ForegroundColor Blue
npm install

# Setup environment
if (!(Test-Path ".env")) {
    Write-Host "Creating .env file from template..." -ForegroundColor Blue
    Copy-Item "../../.env.example" ".env"
    Write-Host "Please edit .env file with your actual configuration values." -ForegroundColor Yellow
}

# Initialize database
Write-Host "Setting up database..." -ForegroundColor Blue
npm run db:generate
npm run db:migrate

# Apply new migration
Write-Host "Applying relationship feedback migration..." -ForegroundColor Blue
$dbPath = "dev.db"
if (Test-Path $dbPath) {
    Get-Content "../../scripts/add-relationship-feedback.sql" | sqlite3 $dbPath
    Write-Host "Database migration completed." -ForegroundColor Green
} else {
    Write-Host "Database file not found. Run 'npm run dev' first to create it." -ForegroundColor Yellow
}

Set-Location "../.."

# Setup Python NLP Service
Write-Host "`nSetting up Python NLP Service..." -ForegroundColor Yellow
Set-Location "python-nlp-service"

# Create virtual environment
if (!(Test-Path "venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Blue
    python -m venv venv
}

# Activate virtual environment and install dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Blue
if ($IsWindows -or $env:OS -eq "Windows_NT") {
    & "venv\Scripts\Activate.ps1"
} else {
    & "venv/bin/Activate.ps1"
}

pip install -r requirements.txt

# Create models directory
if (!(Test-Path "models")) {
    New-Item -ItemType Directory -Name "models"
    Write-Host "Created models directory for LLM files." -ForegroundColor Green
    Write-Host "Download a GGUF model file (e.g., Mistral 7B) and place it in this directory." -ForegroundColor Yellow
}

Set-Location ".."

# Setup Tauri (if Rust is available)
Write-Host "`nChecking for Rust/Tauri setup..." -ForegroundColor Yellow
$rustVersion = rustc --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Rust version: $rustVersion" -ForegroundColor Blue
    
    if (Test-Path "src-tauri") {
        Set-Location "src-tauri"
        Write-Host "Building Tauri dependencies..." -ForegroundColor Blue
        cargo check
        Set-Location ".."
    }
} else {
    Write-Host "Rust not found. Tauri desktop app will not be available." -ForegroundColor Yellow
    Write-Host "Install Rust from https://rustup.rs/ to enable desktop app features." -ForegroundColor Yellow
}

# Create development scripts
Write-Host "`nCreating development scripts..." -ForegroundColor Yellow

# Development start script
$devScript = @'
# Start all development services
Write-Host "Starting Legal NLP Application Development Environment..." -ForegroundColor Green

# Start Python NLP Service
Write-Host "Starting Python NLP Service..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-Command", "cd python-nlp-service; venv\Scripts\Activate.ps1; python main.py"

# Wait a moment for Python service to start
Start-Sleep 3

# Start SvelteKit Development Server
Write-Host "Starting SvelteKit Development Server..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-Command", "cd web-app\sveltekit-frontend; npm run dev"

Write-Host "Services starting up..." -ForegroundColor Green
Write-Host "Web App: http://localhost:5173" -ForegroundColor Blue
Write-Host "Python NLP Service: http://localhost:8001" -ForegroundColor Blue
Write-Host "Press Ctrl+C in each terminal to stop services." -ForegroundColor Yellow
'@

$devScript | Out-File -FilePath "scripts/dev-start.ps1" -Encoding UTF8

# Test script
$testScript = @'
# Test all NLP endpoints
Write-Host "Testing Legal NLP Application..." -ForegroundColor Green

$baseUrl = "http://localhost:5173"
$pythonUrl = "http://localhost:8001"

# Test Python service health
Write-Host "Testing Python NLP Service..." -ForegroundColor Blue
try {
    $health = Invoke-RestMethod -Uri "$pythonUrl/health"
    Write-Host "Python service is healthy: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "Python service not responding" -ForegroundColor Red
}

# Test SvelteKit API endpoints
Write-Host "Testing SvelteKit API endpoints..." -ForegroundColor Blue

$testData = @{
    text = "The defendant John Doe was arrested for assault and battery on January 15, 2024, at 123 Main Street."
    context = "criminal case"
}

try {
    # Test summarization
    $summary = Invoke-RestMethod -Uri "$baseUrl/api/nlp/summarize" -Method POST -Body ($testData | ConvertTo-Json) -ContentType "application/json"
    Write-Host "Summarization test passed" -ForegroundColor Green
    
    # Test entity extraction
    $entities = Invoke-RestMethod -Uri "$baseUrl/api/nlp/extract-entities" -Method POST -Body ($testData | ConvertTo-Json) -ContentType "application/json"
    Write-Host "Entity extraction test passed" -ForegroundColor Green
    
    # Test autocomplete
    $autocomplete = Invoke-RestMethod -Uri "$baseUrl/api/nlp/suggest-autocomplete" -Method POST -Body (@{text="The defendant"} | ConvertTo-Json) -ContentType "application/json"
    Write-Host "Autocomplete test passed" -ForegroundColor Green
    
} catch {
    Write-Host "Some API tests failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "Testing completed." -ForegroundColor Green
'@

$testScript | Out-File -FilePath "scripts/test-nlp.ps1" -Encoding UTF8

Write-Host "`nSetup completed!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Edit .env file with your API keys (Gemini, OpenAI, etc.)" -ForegroundColor White
Write-Host "2. Download a GGUF model to python-nlp-service/models/" -ForegroundColor White
Write-Host "3. Run 'scripts/dev-start.ps1' to start development servers" -ForegroundColor White
Write-Host "4. Run 'scripts/test-nlp.ps1' to test the NLP features" -ForegroundColor White

Write-Host "`nFor production deployment:" -ForegroundColor Yellow
Write-Host "- Configure Vercel environment variables for web app" -ForegroundColor White
Write-Host "- Deploy Python NLP service to a VM or cloud platform" -ForegroundColor White
Write-Host "- Set up Qdrant vector database" -ForegroundColor White
