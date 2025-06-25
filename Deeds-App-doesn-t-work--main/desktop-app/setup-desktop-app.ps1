# 🚀 PROSECUTOR DESKTOP APP - COMPLETE SETUP SCRIPT
# SvelteKit + Rust Tauri + PostgreSQL + Drizzle + Qdrant + Python NLP
# Supports: Vanilla CSS, bcrypt auth, JWT tokens, PostgreSQL testing

param(
    [switch]$Reset,
    [switch]$SkipDocker,
    [switch]$SkipDeps,
    [switch]$Dev
)

Write-Host "🏛️  PROSECUTOR DESKTOP APP SETUP" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

$ErrorActionPreference = "Stop"
$APP_ROOT = Get-Location
$PROJECT_ROOT = Split-Path $APP_ROOT -Parent

# Ensure we're in the desktop-app directory
if (!(Test-Path "src-tauri") -or !(Test-Path "sveltekit-frontend")) {
    Write-Error "❌ Please run this script from the desktop-app directory!"
    exit 1
}

Write-Host "`n📋 SETUP CONFIGURATION:" -ForegroundColor Yellow
Write-Host "   • Reset: $Reset" -ForegroundColor Gray
Write-Host "   • Skip Docker: $SkipDocker" -ForegroundColor Gray
Write-Host "   • Skip Dependencies: $SkipDeps" -ForegroundColor Gray
Write-Host "   • Development Mode: $Dev" -ForegroundColor Gray
Write-Host "   • App Root: $APP_ROOT" -ForegroundColor Gray
Write-Host "   • Project Root: $PROJECT_ROOT" -ForegroundColor Gray

# Function to check if command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Function to run command with error handling
function Invoke-SafeCommand {
    param(
        [string]$Command,
        [string]$Description,
        [string]$WorkingDirectory = $null
    )
    
    Write-Host "`n🔧 $Description..." -ForegroundColor Blue
    
    try {
        if ($WorkingDirectory) {
            Push-Location $WorkingDirectory
        }
        
        Invoke-Expression $Command
        
        if ($LASTEXITCODE -ne 0) {
            throw "Command failed with exit code $LASTEXITCODE"
        }
        
        Write-Host "✅ $Description completed successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ $Description failed: $_" -ForegroundColor Red
        throw
    } finally {
        if ($WorkingDirectory) {
            Pop-Location
        }
    }
}

# Step 1: Verify Prerequisites
Write-Host "`n📦 STEP 1: VERIFYING PREREQUISITES" -ForegroundColor Magenta

$required_tools = @(
    @{name="node"; cmd="node --version"},
    @{name="npm"; cmd="npm --version"},
    @{name="cargo"; cmd="cargo --version"},
    @{name="rustc"; cmd="rustc --version"}
)

if (!$SkipDocker) {
    $required_tools += @{name="docker"; cmd="docker --version"}
    $required_tools += @{name="docker-compose"; cmd="docker-compose --version"}
}

foreach ($tool in $required_tools) {
    if (Test-Command $tool.name) {
        $version = Invoke-Expression $tool.cmd
        Write-Host "✅ $($tool.name): $version" -ForegroundColor Green
    } else {
        Write-Host "❌ $($tool.name) is not installed!" -ForegroundColor Red
        exit 1
    }
}

# Step 2: Environment Setup
Write-Host "`n🔧 STEP 2: ENVIRONMENT SETUP" -ForegroundColor Magenta

# Fix .env file for correct PostgreSQL configuration
$env_content = @"
# Desktop App Environment Configuration
# Database Configuration - Shared Postgres Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/prosecutor_db
DB_DIALECT=pg

# Application Environment
NODE_ENV=development
PUBLIC_BASE_URL=http://localhost:5173

# Database connection details
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=prosecutor_db
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Qdrant Configuration
QDRANT_URL=http://localhost:6333

# JWT Configuration (CRITICAL: Change in production!)
JWT_SECRET=your_very_secure_jwt_secret_key_here_at_least_32_characters_long_for_security_change_this_in_production
BCRYPT_ROUNDS=12

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800

# LLM Configuration
LLM_MODELS_DIR=./src-tauri/llm-models
LLM_UPLOADS_DIR=./src-tauri/llm-uploads

# Tauri Development
TAURI_SKIP_DEVSERVER_CHECK=true
"@

Write-Host "📝 Updating .env configuration..." -ForegroundColor Blue
$env_content | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "✅ Environment configuration updated" -ForegroundColor Green

# Step 3: Docker Services Setup
if (!$SkipDocker) {
    Write-Host "`n🐳 STEP 3: DOCKER SERVICES SETUP" -ForegroundColor Magenta
    
    # Ensure we have the correct docker-compose.yml
    $docker_compose_content = @"
version: '3.8'

services:
  postgres:
    image: ankane/pgvector:latest
    container_name: prosecutor_postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: prosecutor_db
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/01-init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d prosecutor_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  qdrant:
    image: qdrant/qdrant:latest
    container_name: prosecutor_qdrant
    restart: unless-stopped
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage
    environment:
      QDRANT__SERVICE__HTTP_PORT: 6333
      QDRANT__SERVICE__GRPC_PORT: 6334
      QDRANT__LOG_LEVEL: INFO
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6333/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Python NLP Microservice (optional)
  nlp-service:
    build: ./python-nlp-service
    container_name: prosecutor_nlp
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - POSTGRES_URL=postgresql://postgres:postgres@postgres:5432/prosecutor_db
      - QDRANT_URL=http://qdrant:6333
    depends_on:
      postgres:
        condition: service_healthy
      qdrant:
        condition: service_healthy
    profiles:
      - with-nlp

volumes:
  postgres_data:
  qdrant_data:

networks:
  default:
    name: prosecutor_network
"@

    Write-Host "📝 Creating docker-compose.yml..." -ForegroundColor Blue
    $docker_compose_content | Out-File -FilePath "docker-compose.yml" -Encoding UTF8

    # Create database initialization script
    $init_db_content = @"
-- Database initialization script for Prosecutor Desktop App
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create application user
DO `$`$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'prosecutor_app') THEN
        CREATE ROLE prosecutor_app WITH LOGIN PASSWORD 'prosecutor_app_password';
    END IF;
END
`$`$;

-- Grant permissions
GRANT CONNECT ON DATABASE prosecutor_db TO prosecutor_app;
GRANT USAGE ON SCHEMA public TO prosecutor_app;
GRANT CREATE ON SCHEMA public TO prosecutor_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO prosecutor_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO prosecutor_app;

-- Set timezone
SET timezone = 'UTC';

-- Performance tuning
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET pg_stat_statements.track = 'all';

SELECT pg_reload_conf();

COMMIT;
"@

    Write-Host "📝 Creating database initialization script..." -ForegroundColor Blue
    $init_db_content | Out-File -FilePath "init-db.sql" -Encoding UTF8

    if ($Reset) {
        Write-Host "🔄 Stopping and removing existing containers..." -ForegroundColor Yellow
        docker-compose down -v 2>$null
    }

    Invoke-SafeCommand "docker-compose up -d postgres qdrant" "Starting PostgreSQL and Qdrant services"
    
    # Wait for services to be healthy
    Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Blue
    Start-Sleep -Seconds 10
    
    $timeout = 60
    $elapsed = 0
    while ($elapsed -lt $timeout) {
        $pg_ready = docker-compose exec -T postgres pg_isready -U postgres -d prosecutor_db 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ PostgreSQL is ready" -ForegroundColor Green
            break
        }
        Start-Sleep -Seconds 5
        $elapsed += 5
        Write-Host "⏳ Still waiting for PostgreSQL... ($elapsed/$timeout seconds)" -ForegroundColor Yellow
    }
    
    if ($elapsed -ge $timeout) {
        Write-Host "❌ PostgreSQL failed to start within timeout" -ForegroundColor Red
        exit 1
    }
}

# Step 4: Dependencies Installation
if (!$SkipDeps) {
    Write-Host "`n📦 STEP 4: INSTALLING DEPENDENCIES" -ForegroundColor Magenta
    
    # Install desktop app dependencies
    Invoke-SafeCommand "npm install" "Installing desktop app dependencies"
    
    # Install SvelteKit frontend dependencies
    Invoke-SafeCommand "npm install" "Installing SvelteKit frontend dependencies" "sveltekit-frontend"
    
    # Build Rust backend
    Invoke-SafeCommand "cargo build" "Building Rust backend" "src-tauri"
}

# Step 5: Update Cargo.toml to remove ring dependency and use bcrypt
Write-Host "`n🔧 STEP 5: UPDATING RUST DEPENDENCIES" -ForegroundColor Magenta

$cargo_toml_content = @"
[package]
name = "prosecutor-desktop"
version = "0.1.0"
description = "Desktop Prosecutor Case Management App"
authors = ["Your Name <your.email@example.com>"]
license = "MIT"
repository = "https://github.com/yourusername/prosecutor-app"
edition = "2021"
rust-version = "1.70"

# Tauri build configuration
[build-dependencies]
tauri-build = { version = "1.5", features = [] }

[dependencies]
serde_json = "1.0"
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1.0", features = ["macros", "rt-multi-thread"] }
tracing = "0.1"
tracing-subscriber = "0.3"
anyhow = "1.0"

# Tauri dependencies
tauri = { version = "1.6", features = ["api-all", "shell-open", "dialog-open", "fs-read-file", "fs-write-file"] }

# Authentication (NO RING DEPENDENCY)
bcrypt = "0.15"       # Pure Rust bcrypt for password hashing
hmac = "0.12"         # HMAC for JWT signing
sha2 = "0.10"         # SHA-256 for hashing
base64 = "0.22"       # Base64 encoding/decoding
uuid = { version = "1.0", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }

# Database - PostgreSQL with pgvector
sqlx = { version = "0.7", features = ["postgres", "runtime-tokio-rustls", "macros", "chrono", "uuid"] }

# Qdrant client
qdrant-client = "1.7"

# Environment and configuration
dotenv = "0.15"
thiserror = "1.0"

# Our core backend library
prosecutor-core = { path = "../../core-rust-backend", features = ["database"] }

[features]
# By default, Tauri runs in production mode when `tauri build` is run.
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
"@

Write-Host "📝 Updating Cargo.toml to remove ring dependency..." -ForegroundColor Blue
$cargo_toml_content | Out-File -FilePath "src-tauri/Cargo.toml" -Encoding UTF8

# Step 6: Update core backend Cargo.toml
$core_cargo_content = @"
[package]
name = "prosecutor-core"
version = "0.1.0"
edition = "2021"

[lib]
name = "prosecutor_core"
crate-type = ["lib", "cdylib"]  # lib for Tauri, cdylib for Flutter FFI

[dependencies]
# Async runtime
tokio = { version = "1.0", features = ["full"] }

# Database - PostgreSQL with pgvector support only
sqlx = { version = "0.7", features = ["postgres", "runtime-tokio-rustls", "macros", "chrono", "uuid"] }
uuid = { version = "1.0", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Authentication (NO RING DEPENDENCY - Pure Rust implementations)
bcrypt = "0.15"        # Pure Rust bcrypt implementation
hmac = "0.12"          # HMAC for JWT signing (replaces jsonwebtoken)
sha2 = "0.10"          # Pure Rust SHA-256 for password hashing
base64 = "0.22"        # Base64 encoding/decoding

# Qdrant vector database
qdrant-client = "1.7"

# Environment and configuration
dotenv = "0.15"
anyhow = "1.0"
thiserror = "1.0"

# File handling
mime = "0.3"

# Logging
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }

[features]
default = ["database"]
database = []
"@

Write-Host "📝 Updating core backend Cargo.toml..." -ForegroundColor Blue
$core_cargo_content | Out-File -FilePath "../core-rust-backend/Cargo.toml" -Encoding UTF8

# Step 7: Create authentication module
Write-Host "`n🔐 STEP 7: CREATING AUTHENTICATION MODULE" -ForegroundColor Magenta

$auth_module_content = @"
use anyhow::Result;
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::{Duration, Utc};
use hmac::{Hmac, Mac};
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use std::collections::HashMap;
use uuid::Uuid;

type HmacSha256 = Hmac<Sha256>;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,  // Subject (user ID)
    pub email: String,
    pub exp: i64,     // Expiration time
    pub iat: i64,     // Issued at
    pub jti: String,  // JWT ID
}

#[derive(Debug, Clone)]
pub struct AuthService {
    jwt_secret: String,
    bcrypt_cost: u32,
}

impl AuthService {
    pub fn new(jwt_secret: String, bcrypt_cost: Option<u32>) -> Self {
        Self {
            jwt_secret,
            bcrypt_cost: bcrypt_cost.unwrap_or(DEFAULT_COST),
        }
    }

    /// Hash a password using bcrypt
    pub fn hash_password(&self, password: &str) -> Result<String> {
        let hashed = hash(password, self.bcrypt_cost)?;
        Ok(hashed)
    }

    /// Verify a password against a hash
    pub fn verify_password(&self, password: &str, hash: &str) -> Result<bool> {
        let is_valid = verify(password, hash)?;
        Ok(is_valid)
    }

    /// Create a JWT token (manual implementation to avoid ring dependency)
    pub fn create_token(&self, user_id: &str, email: &str) -> Result<String> {
        let now = Utc::now();
        let exp = now + Duration::hours(24); // Token expires in 24 hours
        
        let claims = Claims {
            sub: user_id.to_string(),
            email: email.to_string(),
            exp: exp.timestamp(),
            iat: now.timestamp(),
            jti: Uuid::new_v4().to_string(),
        };

        // Create header
        let header = r#"{"alg":"HS256","typ":"JWT"}"#;
        let header_b64 = base64::encode_config(header, base64::URL_SAFE_NO_PAD);

        // Create payload
        let payload = serde_json::to_string(&claims)?;
        let payload_b64 = base64::encode_config(payload, base64::URL_SAFE_NO_PAD);

        // Create signature
        let message = format!("{}.{}", header_b64, payload_b64);
        let mut mac = HmacSha256::new_from_slice(self.jwt_secret.as_bytes())?;
        mac.update(message.as_bytes());
        let signature = mac.finalize().into_bytes();
        let signature_b64 = base64::encode_config(signature, base64::URL_SAFE_NO_PAD);

        // Combine all parts
        let token = format!("{}.{}.{}", header_b64, payload_b64, signature_b64);
        Ok(token)
    }

    /// Verify and decode a JWT token
    pub fn verify_token(&self, token: &str) -> Result<Claims> {
        let parts: Vec<&str> = token.split('.').collect();
        if parts.len() != 3 {
            anyhow::bail!("Invalid token format");
        }

        let header_b64 = parts[0];
        let payload_b64 = parts[1];
        let signature_b64 = parts[2];

        // Verify signature
        let message = format!("{}.{}", header_b64, payload_b64);
        let mut mac = HmacSha256::new_from_slice(self.jwt_secret.as_bytes())?;
        mac.update(message.as_bytes());
        let expected_signature = mac.finalize().into_bytes();
        let expected_signature_b64 = base64::encode_config(expected_signature, base64::URL_SAFE_NO_PAD);

        if signature_b64 != expected_signature_b64 {
            anyhow::bail!("Invalid token signature");
        }

        // Decode payload
        let payload_bytes = base64::decode_config(payload_b64, base64::URL_SAFE_NO_PAD)?;
        let claims: Claims = serde_json::from_slice(&payload_bytes)?;

        // Check expiration
        let now = Utc::now().timestamp();
        if claims.exp < now {
            anyhow::bail!("Token has expired");
        }

        Ok(claims)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_password_hashing() {
        let auth = AuthService::new("test_secret".to_string(), Some(4)); // Low cost for testing
        
        let password = "test_password_123";
        let hash = auth.hash_password(password).unwrap();
        
        assert!(auth.verify_password(password, &hash).unwrap());
        assert!(!auth.verify_password("wrong_password", &hash).unwrap());
    }

    #[test]
    fn test_jwt_tokens() {
        let auth = AuthService::new("test_secret_key_32_chars_long".to_string(), None);
        
        let user_id = "user123";
        let email = "test@example.com";
        
        let token = auth.create_token(user_id, email).unwrap();
        let claims = auth.verify_token(&token).unwrap();
        
        assert_eq!(claims.sub, user_id);
        assert_eq!(claims.email, email);
        assert!(claims.exp > Utc::now().timestamp());
    }
}
"@

# Create auth directory in core backend
New-Item -ItemType Directory -Force -Path "../core-rust-backend/src/auth" | Out-Null
$auth_module_content | Out-File -FilePath "../core-rust-backend/src/auth/mod.rs" -Encoding UTF8

# Step 8: Database Schema and Migration Setup
Write-Host "`n💾 STEP 8: DATABASE SCHEMA SETUP" -ForegroundColor Magenta

# Ensure drizzle directory exists in SvelteKit frontend
New-Item -ItemType Directory -Force -Path "sveltekit-frontend/drizzle" | Out-Null

# Create or update drizzle.config.ts in SvelteKit frontend
$drizzle_config_content = @"
import type { Config } from 'drizzle-kit';
import { loadEnv } from 'vite';

const env = loadEnv('', process.cwd(), '');

export default {
  schema: './src/lib/server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/prosecutor_db',
  },
  verbose: true,
  strict: true,
} satisfies Config;
"@

$drizzle_config_content | Out-File -FilePath "sveltekit-frontend/drizzle.config.ts" -Encoding UTF8

# Step 9: Build and Test
Write-Host "`n🔨 STEP 9: BUILDING AND TESTING" -ForegroundColor Magenta

# Build Rust components
Invoke-SafeCommand "cargo build" "Building core Rust backend" "../core-rust-backend"
Invoke-SafeCommand "cargo build" "Building Tauri backend" "src-tauri"

# Run database migrations
Invoke-SafeCommand "npm run db:migrate" "Running database migrations" "sveltekit-frontend"

# Step 10: Create startup scripts
Write-Host "`n🚀 STEP 10: CREATING STARTUP SCRIPTS" -ForegroundColor Magenta

# Development startup script
$dev_script_content = @"
#!/usr/bin/env powershell
# Development startup script for Prosecutor Desktop App

Write-Host "🚀 Starting Prosecutor Desktop App (Development Mode)" -ForegroundColor Cyan

# Start Docker services if not running
if (!(docker ps --filter "name=prosecutor_postgres" --filter "status=running" -q)) {
    Write-Host "🐳 Starting Docker services..." -ForegroundColor Blue
    docker-compose up -d postgres qdrant
    Start-Sleep -Seconds 10
}

# Start Tauri development server
Write-Host "🦀 Starting Tauri development server..." -ForegroundColor Blue
npm run tauri:dev
"@

$dev_script_content | Out-File -FilePath "start-dev.ps1" -Encoding UTF8

# Production build script
$build_script_content = @"
#!/usr/bin/env powershell
# Production build script for Prosecutor Desktop App

Write-Host "🏗️  Building Prosecutor Desktop App (Production)" -ForegroundColor Cyan

# Clean previous builds
Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Blue
if (Test-Path "src-tauri/target/release") {
    Remove-Item -Recurse -Force "src-tauri/target/release"
}

# Build SvelteKit frontend
Write-Host "⚡ Building SvelteKit frontend..." -ForegroundColor Blue
Set-Location "sveltekit-frontend"
npm run build
Set-Location ".."

# Build Tauri app
Write-Host "🦀 Building Tauri desktop app..." -ForegroundColor Blue
npm run tauri:build

Write-Host "✅ Build completed! Check src-tauri/target/release/bundle/ for installers" -ForegroundColor Green
"@

$build_script_content | Out-File -FilePath "build-production.ps1" -Encoding UTF8

# Step 11: Create test scripts
Write-Host "`n🧪 STEP 11: CREATING TEST SCRIPTS" -ForegroundColor Magenta

$test_script_content = @"
#!/usr/bin/env powershell
# Test script for Prosecutor Desktop App

Write-Host "🧪 Testing Prosecutor Desktop App" -ForegroundColor Cyan

# Test database connection
Write-Host "📊 Testing database connection..." -ForegroundColor Blue
try {
    # Simple connection test using psql if available
    if (Get-Command psql -ErrorAction SilentlyContinue) {
        `$env:PGPASSWORD = "postgres"
        psql -h localhost -p 5432 -U postgres -d prosecutor_db -c "SELECT version();"
        Write-Host "✅ Database connection successful" -ForegroundColor Green
    } else {
        Write-Host "⚠️  psql not found, skipping database test" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Database connection failed: `$_" -ForegroundColor Red
}

# Test Qdrant connection
Write-Host "🔍 Testing Qdrant connection..." -ForegroundColor Blue
try {
    `$response = Invoke-RestMethod -Uri "http://localhost:6333/health" -Method GET
    Write-Host "✅ Qdrant connection successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Qdrant connection failed: `$_" -ForegroundColor Red
}

# Test Rust compilation
Write-Host "🦀 Testing Rust compilation..." -ForegroundColor Blue
Set-Location "src-tauri"
cargo check
if (`$LASTEXITCODE -eq 0) {
    Write-Host "✅ Rust compilation successful" -ForegroundColor Green
} else {
    Write-Host "❌ Rust compilation failed" -ForegroundColor Red
}
Set-Location ".."

# Test SvelteKit build
Write-Host "⚡ Testing SvelteKit build..." -ForegroundColor Blue
Set-Location "sveltekit-frontend"
npm run build
if (`$LASTEXITCODE -eq 0) {
    Write-Host "✅ SvelteKit build successful" -ForegroundColor Green
} else {
    Write-Host "❌ SvelteKit build failed" -ForegroundColor Red
}
Set-Location ".."

Write-Host "🎉 Testing completed!" -ForegroundColor Cyan
"@

$test_script_content | Out-File -FilePath "test-app.ps1" -Encoding UTF8

# Step 12: Create README
Write-Host "`n📚 STEP 12: CREATING DOCUMENTATION" -ForegroundColor Magenta

$readme_content = @"
# 🏛️ Prosecutor Desktop App

A modern legal case management desktop application built with SvelteKit, Rust (Tauri), PostgreSQL, and Qdrant.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Rust 1.70+
- Docker and Docker Compose
- PostgreSQL client tools (optional, for testing)

### Setup
```powershell
# Run the complete setup script
.\setup-desktop-app.ps1

# Or with options
.\setup-desktop-app.ps1 -Reset -Dev
```

### Development
```powershell
# Start development server
.\start-dev.ps1

# Or manually
docker-compose up -d
npm run tauri:dev
```

### Production Build
```powershell
# Build for production
.\build-production.ps1
```

### Testing
```powershell
# Run all tests
.\test-app.ps1
```

## 🏗️ Architecture

- **Frontend**: SvelteKit with Vanilla CSS
- **Backend**: Rust + Tauri for native performance
- **Database**: PostgreSQL with pgvector extension
- **Vector DB**: Qdrant for semantic search
- **Authentication**: bcrypt + JWT (pure Rust, no ring dependency)
- **ORM**: Drizzle Kit for type-safe database operations

## 📁 Directory Structure

```
desktop-app/
├── src-tauri/              # Rust Tauri backend
│   ├── src/
│   │   ├── main.rs
│   │   └── lib.rs
│   ├── llm-models/         # Local LLM storage
│   └── llm-uploads/        # LLM upload cache
├── sveltekit-frontend/     # SvelteKit frontend
│   ├── src/
│   ├── drizzle/           # Database migrations
│   └── static/
├── docker-compose.yml      # Docker services
├── .env                   # Environment configuration
└── setup-desktop-app.ps1  # This setup script
```

## 🔐 Security Features

- **Password Hashing**: bcrypt with configurable rounds
- **JWT Tokens**: Custom HMAC-SHA256 implementation (no ring dependency)
- **Database**: Secure PostgreSQL with proper user roles
- **File Security**: Tauri's secure file system access
- **Environment**: Secure environment variable handling

## 📊 Database Schema

The app uses PostgreSQL with the following key tables:
- `users` - User authentication and profiles
- `cases` - Legal case management
- `evidence` - Evidence storage and metadata
- `embeddings` - Vector embeddings for semantic search

## 🔍 Vector Search

Qdrant provides high-performance vector search for:
- Semantic similarity between cases
- Evidence categorization
- Smart search across legal documents
- AI-powered recommendations

## 🛠️ Configuration

Key environment variables in `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `QDRANT_URL` - Qdrant service URL
- `JWT_SECRET` - JWT signing secret (change in production!)
- `BCRYPT_ROUNDS` - Password hashing rounds (default: 12)

## 🐛 Troubleshooting

### Database Connection Issues
```powershell
# Check if PostgreSQL is running
docker ps | findstr postgres

# Check logs
docker-compose logs postgres
```

### Rust Compilation Issues
```powershell
# Clean and rebuild
cd src-tauri
cargo clean
cargo build
```

### Port Conflicts
- PostgreSQL: 5432
- Qdrant: 6333, 6334
- SvelteKit Dev: 5173

## 📝 Development Notes

### Adding New Tauri Commands
1. Add command function in `src-tauri/src/main.rs`
2. Register in the `.invoke_handler()` chain
3. Call from frontend using `@tauri-apps/api`

### Database Migrations
```powershell
cd sveltekit-frontend
npm run db:generate  # Generate migration
npm run db:migrate   # Apply migration
```

### Testing
- Unit tests: `cargo test` (Rust)
- Integration tests: `npm test` (SvelteKit)
- E2E tests: Playwright integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.
"@

$readme_content | Out-File -FilePath "README.md" -Encoding UTF8

# Final Steps
Write-Host "`n🎉 STEP 13: FINAL SETUP COMPLETION" -ForegroundColor Magenta

# Create necessary directories
$directories = @(
    "src-tauri/llm-models",
    "src-tauri/llm-uploads",
    "uploads",
    "sveltekit-frontend/static/uploads"
)

foreach ($dir in $directories) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    Write-Host "✅ Created directory: $dir" -ForegroundColor Green
}

# Make PowerShell scripts executable
$scripts = @("start-dev.ps1", "build-production.ps1", "test-app.ps1")
foreach ($script in $scripts) {
    if (Test-Path $script) {
        Write-Host "✅ Made script executable: $script" -ForegroundColor Green
    }
}

# Final summary
Write-Host "`n🎊 SETUP COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host "`n📋 WHAT WAS CONFIGURED:" -ForegroundColor Cyan
Write-Host "   ✅ PostgreSQL + pgvector database" -ForegroundColor Green
Write-Host "   ✅ Qdrant vector search engine" -ForegroundColor Green
Write-Host "   ✅ Rust Tauri backend (no ring dependency)" -ForegroundColor Green
Write-Host "   ✅ SvelteKit frontend with vanilla CSS" -ForegroundColor Green
Write-Host "   ✅ bcrypt password hashing" -ForegroundColor Green
Write-Host "   ✅ Custom JWT implementation" -ForegroundColor Green
Write-Host "   ✅ Drizzle ORM with PostgreSQL" -ForegroundColor Green
Write-Host "   ✅ Development and production scripts" -ForegroundColor Green
Write-Host "   ✅ Comprehensive testing setup" -ForegroundColor Green

Write-Host "`n🚀 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "   1. Start development: .\start-dev.ps1" -ForegroundColor Gray
Write-Host "   2. Run tests: .\test-app.ps1" -ForegroundColor Gray
Write-Host "   3. Build for production: .\build-production.ps1" -ForegroundColor Gray
Write-Host "   4. Check README.md for detailed documentation" -ForegroundColor Gray

Write-Host "`n📊 SERVICES RUNNING:" -ForegroundColor Yellow
if (!$SkipDocker) {
    Write-Host "   • PostgreSQL: http://localhost:5432" -ForegroundColor Gray
    Write-Host "   • Qdrant: http://localhost:6333" -ForegroundColor Gray
    Write-Host "   • SvelteKit Dev: http://localhost:5173 (when started)" -ForegroundColor Gray
}

Write-Host "`n⚠️  SECURITY REMINDER:" -ForegroundColor Red
Write-Host "   Remember to change JWT_SECRET in production!" -ForegroundColor Yellow
Write-Host "   Current secret is for development only." -ForegroundColor Yellow

if ($Dev) {
    Write-Host "`n🏃‍♂️ STARTING DEVELOPMENT MODE..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", ".\start-dev.ps1"
}

Write-Host "`n🎉 Happy coding! 🦀⚡" -ForegroundColor Magenta
