#!/usr/bin/env pwsh
# Development script for desktop app

Write-Host "Starting Desktop App Development..." -ForegroundColor Green

# Build Rust core backend first
Write-Host "Building Rust core backend..." -ForegroundColor Blue
Set-Location "core-rust-backend"
cargo build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build Rust core backend" -ForegroundColor Red
    exit 1
}

# Navigate back and start desktop app
Set-Location ".."
Set-Location "desktop-app"

Write-Host "Installing dependencies..." -ForegroundColor Blue
npm install

Write-Host "Installing frontend dependencies..." -ForegroundColor Blue
Set-Location "sveltekit-frontend"
npm install

Set-Location ".."
Write-Host "Starting Tauri development server..." -ForegroundColor Green
npm run tauri:dev
