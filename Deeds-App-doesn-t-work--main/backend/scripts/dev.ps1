# Development Server Script
# This script starts the Rust backend in development mode

Write-Host "🦀 Starting Rust Backend Development Server..." -ForegroundColor Cyan

# Check if Cargo is installed
if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Cargo (Rust) is not installed. Please install Rust first." -ForegroundColor Red
    Write-Host "💡 Download from: https://rustup.rs/" -ForegroundColor Yellow
    exit 1
}

# Load environment variables
if (Test-Path ".env") {
    Write-Host "📋 Loading environment variables..." -ForegroundColor Yellow
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
}

# Check if database is accessible
Write-Host "🔍 Checking database connection..." -ForegroundColor Yellow
$DATABASE_URL = $env:DATABASE_URL
if (-not $DATABASE_URL) {
    Write-Host "❌ DATABASE_URL not found in environment" -ForegroundColor Red
    exit 1
}

# Create uploads directory
if (-not (Test-Path "uploads")) {
    Write-Host "📁 Creating uploads directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "uploads" -Force | Out-Null
}

# Build and run the server
Write-Host "🔨 Building and starting server..." -ForegroundColor Green
Write-Host "🌐 Server will be available at: http://127.0.0.1:8080" -ForegroundColor Cyan
Write-Host "🏥 Health check: http://127.0.0.1:8080/health" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host "=" * 50 -ForegroundColor Gray

# Run cargo in development mode with auto-reload
cargo watch -x run
