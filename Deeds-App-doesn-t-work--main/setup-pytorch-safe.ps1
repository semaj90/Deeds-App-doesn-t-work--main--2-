# Smart Python Environment Setup for Legal NLP Service
# This script creates an isolated environment without interfering with user's PyTorch

param(
    [switch]$SkipPyTorch,
    [switch]$ForceReinstall,
    [string]$PythonPath = "python"
)

Write-Host "🔧 Legal NLP Service - Smart Environment Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Load environment variables
if (Test-Path ".env") {
    Write-Host "📄 Loading .env configuration..." -ForegroundColor Green
    Get-Content .env | ForEach-Object {
        if ($_ -match "^([^#=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
} else {
    Write-Host "📄 Creating .env from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Please edit .env file with your settings before continuing" -ForegroundColor Green
}

# Get configuration
$VenvPath = $env:PYTHON_VENV_PATH
if (-not $VenvPath) { $VenvPath = "./venv-legal-nlp" }

$PreservePyTorch = $env:PRESERVE_USER_PYTORCH
if (-not $PreservePyTorch) { $PreservePyTorch = "true" }

Write-Host "🐍 Python Environment Configuration:" -ForegroundColor Yellow
Write-Host "   Virtual Environment: $VenvPath" -ForegroundColor Gray
Write-Host "   Preserve PyTorch: $PreservePyTorch" -ForegroundColor Gray
Write-Host "   Skip PyTorch Install: $SkipPyTorch" -ForegroundColor Gray

# Function to detect existing PyTorch
function Test-PyTorchInstallation {
    try {
        $result = & $PythonPath -c "import torch; print(f'PyTorch {torch.__version__} detected'); print(f'CUDA available: {torch.cuda.is_available()}'); print(f'Device: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else \"CPU\"}')" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Existing PyTorch Installation Detected:" -ForegroundColor Green
            $result | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
            return $true
        }
    } catch {
        Write-Host "❌ No PyTorch installation detected" -ForegroundColor Red
    }
    return $false
}

# Function to create isolated virtual environment
function New-IsolatedEnvironment {
    Write-Host "🔨 Creating isolated Python environment..." -ForegroundColor Yellow
    
    if (Test-Path $VenvPath) {
        if ($ForceReinstall) {
            Write-Host "🗑️ Removing existing environment..." -ForegroundColor Red
            Remove-Item -Recurse -Force $VenvPath
        } else {
            Write-Host "✅ Virtual environment already exists at $VenvPath" -ForegroundColor Green
            return
        }
    }
    
    # Create virtual environment
    & $PythonPath -m venv $VenvPath
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to create virtual environment" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Virtual environment created successfully" -ForegroundColor Green
}

# Function to get PyTorch installation command
function Get-PyTorchInstallCommand {
    $pytorchIndex = $env:PYTORCH_INDEX_URL
    
    if ($pytorchIndex) {
        Write-Host "🔧 Using custom PyTorch index: $pytorchIndex" -ForegroundColor Yellow
        return "pip install torch torchvision torchaudio --index-url $pytorchIndex"
    }
      # Detect system capabilities
    try {
        $null = nvidia-smi --query-gpu=driver_version --format=csv,noheader,nounits 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "🎮 NVIDIA GPU detected, installing CUDA PyTorch..." -ForegroundColor Green
            return "pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118"
        }
    } catch {
        Write-Host "💻 No NVIDIA GPU detected, using CPU PyTorch..." -ForegroundColor Yellow
        return "pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu"
    }
    
    return "pip install torch torchvision torchaudio"
}

# Function to install PyTorch-dependent packages
function Install-PyTorchDependentPackages {
    param($ActivationScript)
    
    Write-Host "🧠 Installing PyTorch-dependent packages..." -ForegroundColor Yellow
    
    # Activate virtual environment
    & $ActivationScript
    
    # Install PyTorch if needed
    if (-not (Test-PyTorchInstallation)) {
        $torchCommand = Get-PyTorchInstallCommand
        Write-Host "📦 Installing PyTorch: $torchCommand" -ForegroundColor Yellow
        Invoke-Expression $torchCommand
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ PyTorch installation failed" -ForegroundColor Red
            return $false
        }
    }
    
    # Install ultralytics (requires PyTorch)
    Write-Host "📦 Installing YOLO (ultralytics)..." -ForegroundColor Yellow
    pip install ultralytics==8.0.196
    
    # Install Whisper (requires PyTorch)
    Write-Host "📦 Installing Whisper..." -ForegroundColor Yellow
    pip install openai-whisper==20230918
    
    # Install additional vision models
    Write-Host "📦 Installing additional vision libraries..." -ForegroundColor Yellow
    pip install timm==0.9.7
    
    return $true
}

# Main installation process
Write-Host "🚀 Starting installation process..." -ForegroundColor Cyan

# Step 1: Create virtual environment
New-IsolatedEnvironment

# Step 2: Determine activation script
$ActivationScript = if ($IsWindows -or $env:OS -eq "Windows_NT") {
    "$VenvPath\Scripts\Activate.ps1"
} else {
    "$VenvPath/bin/activate"
}

# Step 3: Install base requirements (no PyTorch dependencies)
Write-Host "📦 Installing base requirements..." -ForegroundColor Yellow
& $ActivationScript
Set-Location python-nlp-service
pip install --upgrade pip
pip install -r requirements-safe.txt

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Base requirements installation failed" -ForegroundColor Red
    exit 1
}

# Step 4: Handle PyTorch installation
if ($PreservePyTorch -eq "true" -and -not $SkipPyTorch) {
    Write-Host "🔍 Checking for existing PyTorch installation..." -ForegroundColor Yellow
    
    # Check if PyTorch exists in user's global environment
    $globalPyTorch = Test-PyTorchInstallation
    
    if ($globalPyTorch) {
        Write-Host "🔗 Linking to existing PyTorch installation..." -ForegroundColor Green
        # Create symbolic links or pip install -e to preserve existing installation
        pip install torch torchvision torchaudio --find-links (Get-Location) --no-deps
    } else {
        Write-Host "📦 Installing fresh PyTorch in virtual environment..." -ForegroundColor Yellow
        $success = Install-PyTorchDependentPackages -ActivationScript $ActivationScript
        if (-not $success) {
            Write-Host "⚠️ PyTorch installation failed. Some features will be limited." -ForegroundColor Yellow
        }
    }
} elseif (-not $SkipPyTorch) {
    $success = Install-PyTorchDependentPackages -ActivationScript $ActivationScript
    if (-not $success) {
        Write-Host "⚠️ PyTorch installation failed. Some features will be limited." -ForegroundColor Yellow
    }
} else {
    Write-Host "⏭️ Skipping PyTorch installation as requested" -ForegroundColor Yellow
}

# Step 5: Create directories
Write-Host "📁 Creating required directories..." -ForegroundColor Yellow
@(
    "models",
    "ai_models", 
    "evidence_storage",
    "temp",
    "cache"
) | ForEach-Object {
    if (-not (Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ | Out-Null
        Write-Host "   Created: $_" -ForegroundColor Gray
    }
}

# Step 6: Test installation
Write-Host "🧪 Testing installation..." -ForegroundColor Yellow
& $ActivationScript

try {
    $testResult = python -c @"
import sys
print(f'Python: {sys.version}')

try:
    import torch
    print(f'PyTorch: {torch.__version__}')
    print(f'CUDA Available: {torch.cuda.is_available()}')
except ImportError:
    print('PyTorch: Not installed (some features will be limited)')

try:
    import sentence_transformers
    print('Sentence Transformers: Available')
except ImportError:
    print('Sentence Transformers: Failed')

try:
    import cv2
    print('OpenCV: Available')
except ImportError:
    print('OpenCV: Failed')

try:
    import qdrant_client
    print('Qdrant Client: Available')
except ImportError:
    print('Qdrant Client: Failed')

print('✅ Installation test completed')
"@

    Write-Host "📊 Installation Summary:" -ForegroundColor Green
    $testResult | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    
} catch {
    Write-Host "⚠️ Installation test failed" -ForegroundColor Yellow
}

# Step 7: Usage instructions
Write-Host "" -ForegroundColor White
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host "To start the NLP service:" -ForegroundColor White
Write-Host "   1. Activate environment: $ActivationScript" -ForegroundColor Gray
Write-Host "   2. cd python-nlp-service" -ForegroundColor Gray
Write-Host "   3. python main.py" -ForegroundColor Gray
Write-Host "" -ForegroundColor White
Write-Host "To upload your GGUF models:" -ForegroundColor White
Write-Host "   Copy .gguf files to: ./models/" -ForegroundColor Gray
Write-Host "" -ForegroundColor White
Write-Host "Environment preserved: $PreservePyTorch" -ForegroundColor Yellow
Write-Host "Virtual environment: $VenvPath" -ForegroundColor Yellow

Set-Location ..
