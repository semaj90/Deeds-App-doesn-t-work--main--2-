# Model Download Script for Local AI
# Downloads recommended GGUF models for the prosecutor system

param(
    [Parameter(Mandatory=$false)]
    [string]$ModelSize = "small"
)

Write-Host "🤖 Local LLM Model Download Script" -ForegroundColor Cyan
Write-Host "Setting up AI models for prosecutor case management..." -ForegroundColor Gray

# Create models directory
$modelsDir = ".\models"
if (-not (Test-Path $modelsDir)) {
    New-Item -ItemType Directory -Path $modelsDir -Force | Out-Null
    Write-Host "📁 Created models directory" -ForegroundColor Green
}

# Model configurations
$models = @{
    "tiny" = @{
        name = "TinyLlama-1.1B-Chat-v1.0"
        file = "tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"
        url = "https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"
        size = "669 MB"
        description = "Ultra-lightweight model for testing and low-resource systems"
    }
    "small" = @{
        name = "Mistral-7B-Instruct-v0.2"
        file = "mistral-7b-instruct-v0.2.Q4_K_M.gguf"
        url = "https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf"
        size = "4.37 GB"
        description = "Excellent for legal text analysis and document classification"
    }
    "medium" = @{
        name = "CodeLlama-7B-Instruct"
        file = "codellama-7b-instruct.Q4_K_M.gguf"
        url = "https://huggingface.co/TheBloke/CodeLlama-7B-Instruct-GGUF/resolve/main/codellama-7b-instruct.Q4_K_M.gguf"
        size = "4.24 GB"
        description = "Good for structured document analysis and tagging"
    }
    "large" = @{
        name = "Llama-2-13B-Chat"
        file = "llama-2-13b-chat.Q4_K_M.gguf"
        url = "https://huggingface.co/TheBloke/Llama-2-13B-Chat-GGUF/resolve/main/llama-2-13b-chat.Q4_K_M.gguf"
        size = "7.37 GB"
        description = "High-quality analysis with better understanding of legal contexts"
    }
}

# Display available models
Write-Host "`n📋 Available Models:" -ForegroundColor Yellow
foreach ($key in $models.Keys) {
    $model = $models[$key]
    $status = if ($ModelSize -eq $key) { "👉" } else { "  " }
    Write-Host "$status $key`: $($model.name) ($($model.size))" -ForegroundColor White
    Write-Host "     $($model.description)" -ForegroundColor Gray
}

$selectedModel = $models[$ModelSize]
if (-not $selectedModel) {
    Write-Host "❌ Invalid model size. Choose: tiny, small, medium, large" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎯 Selected: $($selectedModel.name)" -ForegroundColor Green
Write-Host "📊 Size: $($selectedModel.size)" -ForegroundColor Gray
Write-Host "📝 Description: $($selectedModel.description)" -ForegroundColor Gray

$filePath = Join-Path $modelsDir $selectedModel.file

# Check if model already exists
if (Test-Path $filePath) {
    Write-Host "`n✅ Model already downloaded: $($selectedModel.file)" -ForegroundColor Green
    
    # Update .env file
    $envPath = ".\.env"
    if (Test-Path $envPath) {
        $envContent = Get-Content $envPath -Raw
        $newPath = "LOCAL_LLM_MODEL_PATH=./models/$($selectedModel.file)"
        
        if ($envContent -match "LOCAL_LLM_MODEL_PATH=") {
            $envContent = $envContent -replace "LOCAL_LLM_MODEL_PATH=.*", $newPath
        } else {
            $envContent += "`n$newPath"
        }
        
        Set-Content $envPath $envContent
        Write-Host "📝 Updated .env with model path" -ForegroundColor Green
    }
    
    Write-Host "`n🚀 Ready to use! Start the backend with: .\scripts\dev.ps1" -ForegroundColor Cyan
    exit 0
}

# Download the model
Write-Host "`n⬇️  Downloading $($selectedModel.name)..." -ForegroundColor Yellow
Write-Host "📍 URL: $($selectedModel.url)" -ForegroundColor Gray
Write-Host "💾 Saving to: $filePath" -ForegroundColor Gray

try {
    # Use PowerShell's Invoke-WebRequest with progress
    $ProgressPreference = 'Continue'
    Invoke-WebRequest -Uri $selectedModel.url -OutFile $filePath -UseBasicParsing
    
    Write-Host "✅ Download completed!" -ForegroundColor Green
    
    # Verify file size
    $fileInfo = Get-Item $filePath
    $fileSizeMB = [math]::Round($fileInfo.Length / 1MB, 2)
    Write-Host "📊 Downloaded: $fileSizeMB MB" -ForegroundColor Gray
    
    # Update .env file
    $envPath = ".\.env"
    if (Test-Path $envPath) {
        $envContent = Get-Content $envPath -Raw
        $newPath = "LOCAL_LLM_MODEL_PATH=./models/$($selectedModel.file)"
        
        if ($envContent -match "LOCAL_LLM_MODEL_PATH=") {
            $envContent = $envContent -replace "LOCAL_LLM_MODEL_PATH=.*", $newPath
        } else {
            $envContent += "`n$newPath"
        }
        
        Set-Content $envPath $envContent
        Write-Host "📝 Updated .env with model path" -ForegroundColor Green
    } else {
        Write-Host "⚠️  .env file not found. Create it and add:" -ForegroundColor Yellow
        Write-Host "   LOCAL_LLM_MODEL_PATH=./models/$($selectedModel.file)" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ Download failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "🔍 You can manually download from: $($selectedModel.url)" -ForegroundColor Gray
    exit 1
}

Write-Host "`n🎉 Setup Complete!" -ForegroundColor Green
Write-Host "🚀 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Start services: docker-compose up -d" -ForegroundColor White
Write-Host "  2. Setup database: .\scripts\setup_db.ps1" -ForegroundColor White
Write-Host "  3. Start backend: .\scripts\dev.ps1" -ForegroundColor White
Write-Host "  4. Test API: .\scripts\test_api.ps1" -ForegroundColor White

Write-Host "`n🤖 Your local AI prosecutor system is ready! ⚖️" -ForegroundColor Cyan
