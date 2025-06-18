#!/usr/bin/env pwsh
# Development script for web app

Write-Host "Starting Web App Development Server..." -ForegroundColor Green

# Check if Docker is running for PostgreSQL
$dockerRunning = docker info 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker is not running. Starting database..." -ForegroundColor Yellow
    npm run db:start
    Start-Sleep 5
}

# Navigate to web app and start development
Set-Location "web-app/sveltekit-frontend"
Write-Host "Installing dependencies..." -ForegroundColor Blue
npm install

Write-Host "Running database migrations..." -ForegroundColor Blue
npm run db:migrate

Write-Host "Starting development server..." -ForegroundColor Green
npm run dev
