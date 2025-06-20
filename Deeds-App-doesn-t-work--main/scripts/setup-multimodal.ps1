# Multimodal Evidence Analysis Setup Script
# Run this to set up the advanced evidence processing features

Write-Host "Setting up Multimodal Evidence Analysis..." -ForegroundColor Green

# Check if Python NLP service directory exists
if (!(Test-Path "python-nlp-service")) {
    Write-Host "Error: python-nlp-service directory not found." -ForegroundColor Red
    Write-Host "Run this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

# Install Python dependencies for multimodal processing
Write-Host "`nInstalling Python dependencies for multimodal processing..." -ForegroundColor Yellow
Set-Location "python-nlp-service"

# Install dependencies
Write-Host "Installing OpenCV, YOLO, and image processing libraries..." -ForegroundColor Blue
pip install opencv-python==4.8.1.78
pip install ultralytics==8.0.196
pip install Pillow==10.0.1
pip install pytesseract==0.3.10

Write-Host "Installing audio processing libraries..." -ForegroundColor Blue
pip install openai-whisper==20230918
pip install librosa==0.10.1
pip install soundfile==0.12.1

Write-Host "Installing video processing libraries..." -ForegroundColor Blue
pip install ffmpeg-python==0.2.0

Write-Host "Installing additional ML libraries..." -ForegroundColor Blue
pip install scikit-image==0.21.0
pip install torchvision==0.16.0
pip install timm==0.9.7

# Check for system dependencies
Write-Host "`nChecking system dependencies..." -ForegroundColor Yellow

# Check for Tesseract OCR
$tesseractPath = Get-Command tesseract -ErrorAction SilentlyContinue
if ($tesseractPath) {
    Write-Host "✅ Tesseract OCR found: $($tesseractPath.Source)" -ForegroundColor Green
} else {
    Write-Host "❌ Tesseract OCR not found." -ForegroundColor Red
    Write-Host "Install from: https://github.com/UB-Mannheim/tesseract/wiki" -ForegroundColor Yellow
    Write-Host "Or run: winget install UB-Mannheim.TesseractOCR" -ForegroundColor Yellow
}

# Check for FFmpeg
$ffmpegPath = Get-Command ffmpeg -ErrorAction SilentlyContinue
if ($ffmpegPath) {
    Write-Host "✅ FFmpeg found: $($ffmpegPath.Source)" -ForegroundColor Green
} else {
    Write-Host "❌ FFmpeg not found." -ForegroundColor Red
    Write-Host "Install from: https://ffmpeg.org/download.html" -ForegroundColor Yellow
    Write-Host "Or run: winget install Gyan.FFmpeg" -ForegroundColor Yellow
}

# Create directories for evidence processing
Write-Host "`nCreating evidence processing directories..." -ForegroundColor Blue
$evidenceDir = "../evidence_storage"
$modelsDir = "../ai_models"
$tempDir = "../temp_processing"

if (!(Test-Path $evidenceDir)) {
    New-Item -ItemType Directory -Path $evidenceDir -Force
    Write-Host "Created evidence storage directory: $evidenceDir" -ForegroundColor Green
}

if (!(Test-Path $modelsDir)) {
    New-Item -ItemType Directory -Path $modelsDir -Force
    Write-Host "Created AI models directory: $modelsDir" -ForegroundColor Green
}

if (!(Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir -Force
    Write-Host "Created temporary processing directory: $tempDir" -ForegroundColor Green
}

# Download YOLO models (if user agrees)
Write-Host "`n⚠️  YOLO Model Download" -ForegroundColor Yellow
Write-Host "The system can download open-source YOLO models for object detection." -ForegroundColor White
Write-Host "These are separate from user-provided LLM models and are MIT licensed." -ForegroundColor White
$downloadYolo = Read-Host "Download YOLO models? (y/N)"

if ($downloadYolo -eq "y" -or $downloadYolo -eq "Y") {
    Write-Host "Downloading YOLO models..." -ForegroundColor Blue
    python -c "from ultralytics import YOLO; YOLO('yolov8n.pt'); YOLO('yolov8s.pt')"
    Write-Host "✅ YOLO models downloaded" -ForegroundColor Green
} else {
    Write-Host "Skipped YOLO model download. Models will be downloaded on first use." -ForegroundColor Yellow
}

# Apply database migration
Write-Host "`nApplying database migration for multimodal features..." -ForegroundColor Blue
Set-Location "../web-app/sveltekit-frontend"

$dbPath = "dev.db"
if (Test-Path $dbPath) {
    Get-Content "../../scripts/add-multimodal-evidence.sql" | sqlite3 $dbPath
    Write-Host "✅ Database migration applied successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Database file not found. Run 'npm run dev' first to create it." -ForegroundColor Yellow
}

# Update environment variables
Write-Host "`nUpdating environment configuration..." -ForegroundColor Blue
$envFile = ".env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile
    
    # Add multimodal settings if not present
    if ($envContent -notmatch "ENABLE_MULTIMODAL_ANALYSIS") {
        Add-Content $envFile "`n# Multimodal Evidence Analysis"
        Add-Content $envFile "ENABLE_MULTIMODAL_ANALYSIS=true"
        Add-Content $envFile "EVIDENCE_STORAGE_PATH=../evidence_storage"
        Add-Content $envFile "AI_MODELS_PATH=../ai_models"
        Add-Content $envFile "TEMP_PROCESSING_PATH=../temp_processing"
        Add-Content $envFile "MAX_VIDEO_DURATION=300"
        Add-Content $envFile "MAX_EVIDENCE_FILE_SIZE=100MB"
        Write-Host "✅ Environment variables added" -ForegroundColor Green
    } else {
        Write-Host "✅ Environment variables already configured" -ForegroundColor Green
    }
} else {
    Write-Host "❌ .env file not found. Copy from .env.example first." -ForegroundColor Yellow
}

# Test the multimodal processing
Write-Host "`nTesting multimodal processing setup..." -ForegroundColor Blue
Set-Location "../../python-nlp-service"

# Create a simple test image
python -c "
import cv2
import numpy as np
import os

# Create a simple test image
img = np.ones((200, 300, 3), dtype=np.uint8) * 255
cv2.putText(img, 'TEST EVIDENCE', (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
cv2.rectangle(img, (10, 10), (100, 50), (255, 0, 0), 2)

if not os.path.exists('../temp_processing'):
    os.makedirs('../temp_processing')
    
cv2.imwrite('../temp_processing/test_evidence.jpg', img)
print('✅ Test image created')
"

# Test the processing script
if (Test-Path "multimodal_example.py") {
    Write-Host "Running multimodal processing test..." -ForegroundColor Blue
    python multimodal_example.py --input ../temp_processing/test_evidence.jpg --case-id test_case_001 --enhance --detect-objects --ocr --output ../temp_processing/test_results.json
    
    if (Test-Path "../temp_processing/test_results.json") {
        Write-Host "✅ Multimodal processing test successful!" -ForegroundColor Green
        
        # Show sample results
        $testResults = Get-Content "../temp_processing/test_results.json" | ConvertFrom-Json
        Write-Host "Sample results:" -ForegroundColor White
        Write-Host "- Evidence type: $($testResults.type)" -ForegroundColor Gray
        Write-Host "- Objects detected: $($testResults.objects.Count)" -ForegroundColor Gray
        Write-Host "- Text extracted: $($testResults.text.Length) characters" -ForegroundColor Gray
        Write-Host "- Quality score: $($testResults.analysis.quality_score)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Test failed - no results generated" -ForegroundColor Red
    }
} else {
    Write-Host "❌ multimodal_example.py not found" -ForegroundColor Red
}

# Cleanup test files
Write-Host "`nCleaning up test files..." -ForegroundColor Blue
Remove-Item "../temp_processing/test_*" -Force -ErrorAction SilentlyContinue

Write-Host "`n🎉 Multimodal Evidence Analysis Setup Complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Start the Python NLP service: python main.py" -ForegroundColor White
Write-Host "2. Start the SvelteKit dev server: npm run dev" -ForegroundColor White
Write-Host "3. Upload evidence files through the web interface" -ForegroundColor White
Write-Host "4. Use the interactive anchor point system for analysis" -ForegroundColor White

Write-Host "`n📚 Documentation:" -ForegroundColor Yellow
Write-Host "- Full guide: COMPLETE_NLP_IMPLEMENTATION.md" -ForegroundColor White
Write-Host "- User model requirements: USER_MODEL_REQUIREMENTS.md" -ForegroundColor White
Write-Host "- Example usage: python-nlp-service/multimodal_example.py --help" -ForegroundColor White

# Return to original directory
Set-Location ".."
