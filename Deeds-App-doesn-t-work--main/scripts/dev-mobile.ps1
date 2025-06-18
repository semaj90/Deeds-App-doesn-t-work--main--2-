#!/usr/bin/env pwsh
# Development script for mobile app

Write-Host "Starting Mobile App Development..." -ForegroundColor Green

# Check if Flutter is installed
$flutterInstalled = Get-Command flutter -ErrorAction SilentlyContinue
if (-not $flutterInstalled) {
    Write-Host "Flutter is not installed. Please install Flutter first." -ForegroundColor Red
    Write-Host "   Visit: https://flutter.dev/docs/get-started/install" -ForegroundColor Yellow
    exit 1
}

# Build Rust FFI bindings first
Write-Host "Building Rust FFI bindings..." -ForegroundColor Blue
Set-Location "mobile-app/native_bindings"
cargo build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build Rust FFI bindings" -ForegroundColor Red
    exit 1
}

# Navigate to Flutter project
Set-Location "../flutter_project"

Write-Host "Getting Flutter dependencies..." -ForegroundColor Blue
flutter pub get

Write-Host "Starting Flutter development..." -ForegroundColor Green
Write-Host "Tip: Make sure you have an emulator running or a device connected" -ForegroundColor Yellow
flutter run
