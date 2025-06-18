#!/usr/bin/env pwsh
# Build script for all platforms

param(
    [string]$Target = "all"
)

Write-Host "Building Prosecutor App..." -ForegroundColor Green

function Build-RustCore {
    Write-Host "Building Rust core backend..." -ForegroundColor Blue
    Set-Location "core-rust-backend"
    cargo build --release
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to build Rust core backend" -ForegroundColor Red
        return $false
    }
    Set-Location ".."
    return $true
}

function Build-Web {
    Write-Host "Building web app..." -ForegroundColor Blue
    Set-Location "web-app/sveltekit-frontend"
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to build web app" -ForegroundColor Red
        Set-Location "../.."
        return $false
    }
    Set-Location "../.."
    return $true
}

function Build-Desktop {
    Write-Host "Building desktop app..." -ForegroundColor Blue
    Set-Location "desktop-app"
    npm run tauri:build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to build desktop app" -ForegroundColor Red
        Set-Location ".."
        return $false
    }
    Set-Location ".."
    return $true
}

function Build-Mobile {
    Write-Host "Building mobile app..." -ForegroundColor Blue
    
    # Build Rust FFI first
    Set-Location "mobile-app/native_bindings"
    cargo build --release
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to build Rust FFI bindings" -ForegroundColor Red
        Set-Location "../.."
        return $false
    }
    
    # Build Flutter app
    Set-Location "../flutter_project"
    flutter build apk
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to build Flutter app" -ForegroundColor Red
        Set-Location "../.."
        return $false
    }
    Set-Location "../.."
    return $true
}

# Build based on target
$success = $true

if ($Target -eq "all" -or $Target -eq "rust") {
    $success = Build-RustCore
}

if ($success -and ($Target -eq "all" -or $Target -eq "web")) {
    $success = Build-Web
}

if ($success -and ($Target -eq "all" -or $Target -eq "desktop")) {
    $success = Build-Desktop
}

if ($success -and ($Target -eq "all" -or $Target -eq "mobile")) {
    $success = Build-Mobile
}

if ($success) {
    Write-Host "Build completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}
