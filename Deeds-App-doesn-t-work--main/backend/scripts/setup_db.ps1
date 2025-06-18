# PostgreSQL Database Setup Script
# This script sets up the PostgreSQL database for the Rust backend

Write-Host "🐘 Setting up PostgreSQL database..." -ForegroundColor Cyan

# Check if PostgreSQL is running
$pgStatus = Get-Process -Name "postgres" -ErrorAction SilentlyContinue
if (-not $pgStatus) {
    Write-Host "❌ PostgreSQL is not running. Please start PostgreSQL first." -ForegroundColor Red
    Write-Host "💡 You can start it with: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

# Load environment variables
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
}

$DATABASE_URL = $env:DATABASE_URL
if (-not $DATABASE_URL) {
    $DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/prosecutor_db"
}

Write-Host "📊 Database URL: $($DATABASE_URL -replace ':.*@', ':***@')" -ForegroundColor Green

# Test database connection
Write-Host "🔍 Testing database connection..." -ForegroundColor Yellow

try {
    # Use psql to test connection and create database if needed
    $createDbScript = @"
DO `$`$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'prosecutor_db') THEN
        CREATE DATABASE prosecutor_db;
    END IF;
END
`$`$;
"@

    # Try to connect and create database
    $env:PGPASSWORD = "postgres"
    echo $createDbScript | psql -h localhost -U postgres -d postgres

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database connection successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ Database connection failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error connecting to database: $_" -ForegroundColor Red
    exit 1
}

# Check if we need to run SvelteKit migrations
Write-Host "🔄 Checking database schema..." -ForegroundColor Yellow

$tablesQuery = "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'cases', 'evidence');"
$env:PGPASSWORD = "postgres"
$tableCount = psql -h localhost -U postgres -d prosecutor_db -t -c $tablesQuery

if ($tableCount -match "\s*(\d+)\s*") {
    $count = [int]$matches[1]
    if ($count -lt 3) {
        Write-Host "⚠️  Database schema incomplete. Please run SvelteKit migrations first:" -ForegroundColor Yellow
        Write-Host "   cd .. && npm run db:migrate" -ForegroundColor Cyan
        exit 1
    } else {
        Write-Host "✅ Database schema looks good!" -ForegroundColor Green
    }
}

Write-Host "🎉 Database setup complete!" -ForegroundColor Green
Write-Host "💡 You can now run: .\scripts\dev.ps1" -ForegroundColor Cyan
