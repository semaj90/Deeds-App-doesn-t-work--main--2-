#!/usr/bin/env pwsh
# Setup script for the entire monorepo

Write-Host "Setting up Prosecutor App Monorepo..." -ForegroundColor Green

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Blue

# Check Node.js
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Node.js found: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "Node.js not found. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check Rust
$rustVersion = rustc --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Rust found: $rustVersion" -ForegroundColor Green
} else {
    Write-Host "Rust not found. Please install Rust first." -ForegroundColor Red
    Write-Host "   Visit: https://rustup.rs/" -ForegroundColor Yellow
    exit 1
}

# Check Docker (optional for PostgreSQL)
$dockerVersion = docker --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Docker found: $dockerVersion" -ForegroundColor Green
} else {
    Write-Host "Docker not found. You can still use SQLite for local development." -ForegroundColor Yellow
}

# Install root dependencies
Write-Host "Installing root dependencies..." -ForegroundColor Blue
npm install

# Install all platform dependencies
Write-Host "Installing all platform dependencies..." -ForegroundColor Blue
npm run install:all

# Build Rust core backend
Write-Host "Building Rust core backend..." -ForegroundColor Blue
npm run rust:build

Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Quick start commands:" -ForegroundColor Cyan
Write-Host "  npm run web:dev     - Start web development server" -ForegroundColor White
Write-Host "  npm run desktop:dev - Start desktop app development" -ForegroundColor White
Write-Host "  npm run mobile:dev  - Start mobile app development" -ForegroundColor White
Write-Host ""
Write-Host "For more information, see MULTI_PLATFORM_README.md" -ForegroundColor Yellow
