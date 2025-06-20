# Test Environment Isolation Script
# This script verifies that our setup doesn't interfere with user's PyTorch

param(
    [string]$VenvPath = "./venv-legal-nlp"
)

Write-Host "🧪 Testing Environment Isolation" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check global Python environment
Write-Host "1️⃣  Testing Global Python Environment:" -ForegroundColor Yellow
try {
    $globalPython = python -c @"
import sys
print(f'Python: {sys.executable}')
try:
    import torch
    print(f'PyTorch: {torch.__version__} (Global)')
    print(f'Location: {torch.__file__}')
except ImportError:
    print('PyTorch: Not found in global environment')
try:
    import numpy
    print(f'NumPy: {numpy.__version__} (Global)')
except ImportError:
    print('NumPy: Not found in global environment')
"@
    
    Write-Host "   Global Environment Status:" -ForegroundColor Green
    $globalPython | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
} catch {
    Write-Host "   ❌ Failed to check global environment: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Check virtual environment (if exists)
if (Test-Path $VenvPath) {
    Write-Host "2️⃣  Testing Virtual Environment:" -ForegroundColor Yellow
    
    $activationScript = if ($IsWindows -or $env:OS -eq "Windows_NT") {
        "$VenvPath\Scripts\Activate.ps1"
    } else {
        "$VenvPath/bin/activate"
    }
    
    if (Test-Path $activationScript) {
        try {
            & $activationScript
            
            $venvPython = python -c @"
import sys
print(f'Python: {sys.executable}')
print(f'Virtual Env: {getattr(sys, "base_prefix", sys.prefix)}')
try:
    import torch
    print(f'PyTorch: {torch.__version__} (Virtual)')
    print(f'Location: {torch.__file__}')
    print(f'CUDA: {torch.cuda.is_available()}')
except ImportError:
    print('PyTorch: Not found in virtual environment')
try:
    import numpy
    print(f'NumPy: {numpy.__version__} (Virtual)')
except ImportError:
    print('NumPy: Not found in virtual environment')
try:
    import sentence_transformers
    print('SentenceTransformers: Available (Virtual)')
except ImportError:
    print('SentenceTransformers: Not found in virtual environment')
try:
    import fastapi
    print('FastAPI: Available (Virtual)')
except ImportError:
    print('FastAPI: Not found in virtual environment')
"@
            
            Write-Host "   Virtual Environment Status:" -ForegroundColor Green
            $venvPython | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
            
        } catch {
            Write-Host "   ❌ Failed to activate virtual environment: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "   ❌ Activation script not found: $activationScript" -ForegroundColor Red
    }
} else {
    Write-Host "2️⃣  Virtual Environment: Not found at $VenvPath" -ForegroundColor Yellow
}

Write-Host ""

# Test 3: Check environment variables
Write-Host "3️⃣  Testing Environment Variables:" -ForegroundColor Yellow
@(
    "PYTHONPATH",
    "VIRTUAL_ENV",
    "CONDA_DEFAULT_ENV",
    "PRESERVE_USER_PYTORCH",
    "SKIP_PYTORCH_INSTALL",
    "PYTORCH_INDEX_URL"
) | ForEach-Object {
    $value = [Environment]::GetEnvironmentVariable($_, "Process")
    if ($value) {
        Write-Host "   $_ = $value" -ForegroundColor Gray
    } else {
        Write-Host "   $_ = (not set)" -ForegroundColor DarkGray
    }
}

Write-Host ""

# Test 4: Check file system isolation
Write-Host "4️⃣  Testing File System Isolation:" -ForegroundColor Yellow
@(
    @{ Path = $VenvPath; Name = "Virtual Environment" },
    @{ Path = "python-nlp-service"; Name = "NLP Service Directory" },
    @{ Path = "models"; Name = "Models Directory" },
    @{ Path = ".env"; Name = "Environment Config" },
    @{ Path = "python-nlp-service/requirements-safe.txt"; Name = "Safe Requirements" },
    @{ Path = "python-nlp-service/requirements-pytorch.txt"; Name = "PyTorch Requirements" }
) | ForEach-Object {
    if (Test-Path $_.Path) {
        Write-Host "   ✅ $($_.Name): $($_.Path)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $($_.Name): $($_.Path) (missing)" -ForegroundColor Red
    }
}

Write-Host ""

# Test 5: Python executable comparison
Write-Host "5️⃣  Python Executable Comparison:" -ForegroundColor Yellow
try {
    $globalExe = python -c "import sys; print(sys.executable)"
    Write-Host "   Global Python: $globalExe" -ForegroundColor Gray
    
    if (Test-Path $VenvPath) {
        $venvExe = if ($IsWindows -or $env:OS -eq "Windows_NT") {
            "$VenvPath\Scripts\python.exe"
        } else {
            "$VenvPath/bin/python"
        }
        
        if (Test-Path $venvExe) {
            Write-Host "   Virtual Python: $venvExe" -ForegroundColor Gray
            
            if ($globalExe -ne $venvExe) {
                Write-Host "   ✅ Python executables are different (good isolation)" -ForegroundColor Green
            } else {
                Write-Host "   ⚠️  Python executables are the same (check virtual environment)" -ForegroundColor Yellow
            }
        }
    }
} catch {
    Write-Host "   ❌ Failed to compare Python executables: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Environment isolation test completed" -ForegroundColor Green
Write-Host ""
Write-Host "💡 If you see any issues above:" -ForegroundColor Yellow
Write-Host "   1. Run: .\setup-pytorch-isolated.ps1 -ForceReinstall" -ForegroundColor Gray
Write-Host "   2. Make sure you're activating the virtual environment" -ForegroundColor Gray
Write-Host "   3. Check the .env file settings" -ForegroundColor Gray
