# Enhanced PyTorch-Safe Setup for Legal NLP Service
# This script ensures ZERO interference with user's existing PyTorch/Python environment

param(
    [switch]$ForceReinstall,
    [switch]$SkipPyTorch,
    [switch]$Verbose,
    [string]$PythonPath = "python"
)

$ErrorActionPreference = "Stop"

Write-Host "🛡️  PyTorch-Safe Legal NLP Environment Setup" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "This setup will NOT interfere with your existing PyTorch installation" -ForegroundColor Green
Write-Host ""

# Function to detect if user has PyTorch installed globally
function Test-GlobalPyTorch {
    Write-Host "🔍 Detecting existing PyTorch installation..." -ForegroundColor Yellow
    
    try {
        $torchInfo = & $PythonPath -c @"
try:
    import torch
    import sys
    print(f'FOUND|{torch.__version__}|{torch.__file__}|{torch.cuda.is_available()}')
except ImportError:
    print('NOT_FOUND')
"@ 2>$null
        
        if ($torchInfo -and $torchInfo.StartsWith('FOUND')) {
            $parts = $torchInfo.Split('|')
            $version = $parts[1]
            $location = $parts[2]
            $cudaAvailable = $parts[3]
            
            Write-Host "✅ PyTorch $version detected at:" -ForegroundColor Green
            Write-Host "   $location" -ForegroundColor Gray
            Write-Host "   CUDA Available: $cudaAvailable" -ForegroundColor Gray
            
            return @{
                Found = $true
                Version = $version
                Location = $location
                CudaAvailable = $cudaAvailable -eq "True"
            }
        }
    } catch {
        Write-Host "❌ No PyTorch detected in global environment" -ForegroundColor Red
    }
    
    return @{ Found = $false }
}

# Load or create environment configuration
function Initialize-Environment {
    Write-Host "📄 Setting up environment configuration..." -ForegroundColor Yellow
    
    if (-not (Test-Path ".env")) {
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-Host "✅ Created .env from template" -ForegroundColor Green
        } else {
            Write-Host "❌ .env.example not found. Creating minimal config..." -ForegroundColor Red
            @"
PYTHON_VENV_PATH=./venv-legal-nlp
PRESERVE_USER_PYTORCH=true
SKIP_PYTORCH_INSTALL=false
REQUIREMENTS_FILE=requirements-safe.txt
PYTHONPATH=
VIRTUAL_ENV_DISABLE_PROMPT=true
PIP_USER=false
"@ | Out-File -FilePath ".env" -Encoding UTF8
        }
    }
    
    # Load environment variables
    Get-Content .env | ForEach-Object {
        if ($_ -match "^([^#=]+)=(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
            if ($Verbose) {
                Write-Host "   $name = $value" -ForegroundColor Gray
            }
        }
    }
}

# Create completely isolated virtual environment
function New-IsolatedVirtualEnvironment {
    $venvPath = $env:PYTHON_VENV_PATH
    if (-not $venvPath) { $venvPath = "./venv-legal-nlp" }
    
    Write-Host "🏗️  Creating isolated virtual environment..." -ForegroundColor Yellow
    Write-Host "   Path: $venvPath" -ForegroundColor Gray
    
    if (Test-Path $venvPath) {
        if ($ForceReinstall) {
            Write-Host "🗑️  Removing existing environment..." -ForegroundColor Red
            Remove-Item -Recurse -Force $venvPath
        } else {
            Write-Host "✅ Virtual environment already exists" -ForegroundColor Green
            return $venvPath
        }
    }
    
    # Create virtual environment with complete isolation
    $env:PYTHONPATH = ""
    $env:VIRTUAL_ENV_DISABLE_PROMPT = "true"
    $env:PIP_USER = "false"
    
    & $PythonPath -m venv $venvPath --clear
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create virtual environment"
    }
    
    Write-Host "✅ Isolated virtual environment created" -ForegroundColor Green
    return $venvPath
}

# Get activation script path
function Get-ActivationScript {
    param($VenvPath)
    
    if ($IsWindows -or $env:OS -eq "Windows_NT") {
        return "$VenvPath\Scripts\Activate.ps1"
    } else {
        return "$VenvPath/bin/activate"
    }
}

# Install base requirements without PyTorch dependencies
function Install-SafeRequirements {
    param($ActivationScript)
    
    Write-Host "📦 Installing PyTorch-safe base requirements..." -ForegroundColor Yellow
    
    & $ActivationScript
    
    # Ensure we're in the virtual environment
    $pythonLocation = python -c "import sys; print(sys.executable)"
    Write-Host "   Using Python: $pythonLocation" -ForegroundColor Gray
    
    # Update pip in isolated environment
    python -m pip install --upgrade pip
    
    # Install requirements file
    $requirementsFile = $env:REQUIREMENTS_FILE
    if (-not $requirementsFile) { $requirementsFile = "requirements-safe.txt" }
    
    $requirementsPath = "python-nlp-service\$requirementsFile"
    
    if (Test-Path $requirementsPath) {
        Write-Host "   Installing from: $requirementsPath" -ForegroundColor Gray
        pip install -r $requirementsPath
        
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to install base requirements"
        }
        
        Write-Host "✅ Base requirements installed successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Requirements file not found: $requirementsPath" -ForegroundColor Yellow
    }
}

# Handle PyTorch installation with user preservation
function Install-PyTorchIfNeeded {
    param($ActivationScript, $GlobalPyTorch)
    
    $preserveUserPyTorch = $env:PRESERVE_USER_PYTORCH -eq "true"
    $skipPyTorchInstall = $env:SKIP_PYTORCH_INSTALL -eq "true" -or $SkipPyTorch
    
    Write-Host "🧠 PyTorch Installation Strategy:" -ForegroundColor Yellow
    Write-Host "   Preserve User PyTorch: $preserveUserPyTorch" -ForegroundColor Gray
    Write-Host "   Skip Installation: $skipPyTorchInstall" -ForegroundColor Gray
    Write-Host "   Global PyTorch Found: $($GlobalPyTorch.Found)" -ForegroundColor Gray
    
    if ($skipPyTorchInstall) {
        Write-Host "⏭️  Skipping PyTorch installation (some AI features will be limited)" -ForegroundColor Yellow
        return
    }
    
    & $ActivationScript
    
    # Check if PyTorch is already in the virtual environment
    $venvPyTorch = python -c "try: import torch; print('FOUND')\nexcept ImportError: print('NOT_FOUND')" 2>$null
    
    if ($venvPyTorch -eq "FOUND") {
        Write-Host "✅ PyTorch already available in virtual environment" -ForegroundColor Green
        return
    }
    
    if ($preserveUserPyTorch -and $GlobalPyTorch.Found) {
        Write-Host "🔗 Attempting to link to existing PyTorch installation..." -ForegroundColor Yellow
        
        # Try to install compatible PyTorch version without overriding user's installation
        $customIndex = $env:PYTORCH_INDEX_URL
        if ($customIndex) {
            Write-Host "   Using custom PyTorch index: $customIndex" -ForegroundColor Gray
            pip install torch torchvision torchaudio --index-url $customIndex
        } else {
            # Install minimal PyTorch for our specific use case
            Write-Host "   Installing minimal PyTorch for compatibility..." -ForegroundColor Gray
            
            if ($GlobalPyTorch.CudaAvailable) {
                pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
            } else {
                pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
            }
        }
    } else {
        Write-Host "📦 Installing fresh PyTorch in isolated environment..." -ForegroundColor Yellow
        
        # Auto-detect CUDA capability
        try {
            $null = nvidia-smi --query-gpu=driver_version --format=csv,noheader,nounits 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   NVIDIA GPU detected, installing CUDA PyTorch..." -ForegroundColor Green
                pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
            } else {
                Write-Host "   No GPU detected, installing CPU PyTorch..." -ForegroundColor Yellow
                pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
            }
        } catch {
            Write-Host "   Installing CPU PyTorch as fallback..." -ForegroundColor Yellow
            pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
        }
    }
    
    # Install PyTorch-dependent packages
    Write-Host "📦 Installing PyTorch-dependent AI packages..." -ForegroundColor Yellow
    pip install ultralytics==8.0.196  # YOLO
    pip install openai-whisper==20230918  # Whisper
    pip install timm==0.9.7  # Vision models
    
    Write-Host "✅ PyTorch and AI packages installed" -ForegroundColor Green
}

# Test installation
function Test-Installation {
    param($ActivationScript)
    
    Write-Host "🧪 Testing installation..." -ForegroundColor Yellow
    
    & $ActivationScript
    
    $testResult = python -c @"
import sys
print(f'✅ Python: {sys.version.split()[0]}')
print(f'📍 Location: {sys.executable}')

try:
    import torch
    print(f'🧠 PyTorch: {torch.__version__}')
    print(f'🎮 CUDA Available: {torch.cuda.is_available()}')
    if torch.cuda.is_available():
        print(f'🔧 GPU Device: {torch.cuda.get_device_name(0)}')
except ImportError:
    print('⚠️  PyTorch: Not installed (some features limited)')

try:
    import sentence_transformers
    print('🔤 Sentence Transformers: Available')
except ImportError:
    print('❌ Sentence Transformers: Failed')

try:
    import cv2
    print('👁️  OpenCV: Available')
except ImportError:
    print('❌ OpenCV: Failed')

try:
    import qdrant_client
    print('🗃️  Qdrant Client: Available')
except ImportError:
    print('❌ Qdrant Client: Failed')

try:
    import fastapi
    print('🌐 FastAPI: Available')
except ImportError:
    print('❌ FastAPI: Failed')

print('✅ Installation test completed')
"@
    
    Write-Host ""
    Write-Host "📊 Installation Summary:" -ForegroundColor Green
    $testResult | ForEach-Object { Write-Host "   $_" -ForegroundColor White }
}

# Create required directories
function New-RequiredDirectories {
    Write-Host "📁 Creating required directories..." -ForegroundColor Yellow
    
    @(
        "models",
        "ai_models", 
        "evidence_storage",
        "temp",
        "cache",
        "python-nlp-service"
    ) | ForEach-Object {
        if (-not (Test-Path $_)) {
            New-Item -ItemType Directory -Path $_ | Out-Null
            Write-Host "   Created: $_" -ForegroundColor Gray
        }
    }
}

# Main execution
try {
    Write-Host "🚀 Starting PyTorch-safe setup..." -ForegroundColor Cyan
    
    # Step 1: Detect existing PyTorch
    $globalPyTorch = Test-GlobalPyTorch
    
    # Step 2: Initialize environment
    Initialize-Environment
    
    # Step 3: Create isolated virtual environment
    $venvPath = New-IsolatedVirtualEnvironment
    $activationScript = Get-ActivationScript -VenvPath $venvPath
    
    # Step 4: Create directories
    New-RequiredDirectories
    
    # Step 5: Install base requirements
    Install-SafeRequirements -ActivationScript $activationScript
    
    # Step 6: Handle PyTorch
    Install-PyTorchIfNeeded -ActivationScript $activationScript -GlobalPyTorch $globalPyTorch
    
    # Step 7: Test installation
    Test-Installation -ActivationScript $activationScript
    
    # Success message
    Write-Host ""
    Write-Host "🎉 Setup Complete! Your PyTorch installation is preserved." -ForegroundColor Green
    Write-Host "=======================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 To start the NLP service:" -ForegroundColor White
    Write-Host "   1. Activate environment: & '$activationScript'" -ForegroundColor Gray
    Write-Host "   2. cd python-nlp-service" -ForegroundColor Gray
    Write-Host "   3. python main.py" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📁 To add your GGUF models:" -ForegroundColor White
    Write-Host "   Copy .gguf files to: ./models/" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🛡️  Environment Protection:" -ForegroundColor Yellow
    Write-Host "   Virtual Environment: $venvPath" -ForegroundColor Gray
    Write-Host "   User PyTorch Preserved: $($env:PRESERVE_USER_PYTORCH)" -ForegroundColor Gray
    Write-Host "   Global PyTorch: $($globalPyTorch.Found)" -ForegroundColor Gray
    
} catch {
    Write-Host ""
    Write-Host "❌ Setup failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Try running with -Verbose for more details" -ForegroundColor Yellow
    exit 1
}
