# Shared Database for Prosecutor Monorepo

This directory contains the shared PostgreSQL schema and configuration used across all apps in the monorepo:

- ✅ **SvelteKit Web App** (Drizzle ORM)
- 🦀 **Rust/Tauri Desktop App** 
- 📱 **Flutter Mobile App**

## 📁 Directory Structure

```
/db/
├── schema/                 # Modular schema files
│   ├── _shared.ts         # Common utilities & types
│   ├── auth.ts            # Authentication & users
│   ├── cases.ts           # Case management
│   ├── evidence.ts        # Evidence & file management  
│   ├── legal.ts           # Criminals, crimes, statutes
│   ├── ai.ts              # AI analysis & embeddings
│   ├── reporting.ts       # Reports & system tables
│   └── index.ts           # Main export file
├── migrations/            # Generated Drizzle migrations
├── init/                  # Database initialization scripts
├── docker-compose.yml     # Shared Postgres + Qdrant
├── drizzle.config.ts      # Shared Drizzle configuration
└── .env.example           # Environment variables template
```

## 🚀 Quick Start

### 1. Start the Database

```bash
# Navigate to db directory
cd db

# Copy environment variables
cp .env.example .env

# Start PostgreSQL and Qdrant containers
docker compose up -d

# Check containers are running
docker compose ps
```

### 2. Run Migrations

```bash
# Generate migrations (if schema changed)
npx drizzle-kit generate

# Apply migrations to database
npx drizzle-kit push
```

### 3. Connect from Apps

#### SvelteKit Web App
```typescript
// src/lib/server/db.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../../../db/schema';

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
```

#### Rust/Tauri Desktop App
```rust
// src-tauri/src/database.rs
use tokio_postgres::{connect, NoTls};

let (client, connection) = connect(
    "host=localhost user=postgres password=postgres dbname=prosecutor_app", 
    NoTls
).await?;
```

#### Flutter Mobile App
```dart
// Use HTTP API endpoints from SvelteKit app
// or connect via postgres client library
```

## 📊 Schema Overview

### 🔐 Authentication
- `users` - User accounts & profiles
- `sessions` - Active user sessions
- `account` - OAuth accounts
- `user_preferences` - User settings

### 📋 Case Management  
- `cases` - Main case records
- `case_events` - Case timeline events
- `case_activities` - Activity tracking
- `case_relationships` - Related cases

### 📄 Evidence Management
- `evidence` - Evidence files & metadata
- `evidence_files` - Multi-file attachments
- `evidence_anchor_points` - Interactive annotations

### ⚖️ Legal Entities
- `criminals` - Criminal profiles
- `crimes` - Crime records
- `statutes` - Legal statutes & laws
- `case_criminals` - Case-criminal relationships

### 🤖 AI & Analytics
- `ai_analyses` - AI processing results
- `content_embeddings` - Vector embeddings
- `nlp_analysis_cache` - NLP cache
- `case_text_fragments` - Extracted text

### 📊 Reporting
- `reports` - Generated reports
- `case_evidence_summaries` - Case summaries
- `case_relationship_feedback` - ML feedback

## 🔧 Database Management

### Migrations
```bash
# Generate new migration
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit push

# Reset database (careful!)
npx drizzle-kit reset
```

### Monitoring
```bash
# View logs
docker compose logs postgres -f

# Connect to database
docker compose exec postgres psql -U postgres -d prosecutor_app

# Access PgAdmin (if enabled)
open http://localhost:5050
# Email: admin@prosecutor.app
# Password: admin
```

### Backup & Restore
```bash
# Backup
docker compose exec postgres pg_dump -U postgres prosecutor_app > backup.sql

# Restore
docker compose exec -T postgres psql -U postgres prosecutor_app < backup.sql
```

## 🌐 Connection Details

- **PostgreSQL**: `localhost:5432`
- **Database**: `prosecutor_app`
- **User**: `postgres`
- **Password**: `postgres`
- **Qdrant**: `localhost:6333`
- **PgAdmin**: `localhost:5050` (optional)

## 📝 Environment Variables

Copy `.env.example` to `.env` and update:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/prosecutor_app
QDRANT_URL=http://localhost:6333
JWT_SECRET=your-secret-key
# ... see .env.example for full list
```

## 🔒 Security Notes

- Change default passwords in production
- Use SSL connections in production
- Limit database access by IP
- Regular backup strategy
- Monitor for security updates

## 📚 Drizzle ORM Usage

```typescript
// Example queries across all apps
import { db } from './db';
import { cases, users, evidence } from '../../../../db/schema';

// Create case
const newCase = await db.insert(cases).values({
  title: 'New Case',
  description: 'Case details...',
}).returning();

// Get cases with prosecutor
const casesWithProsecutor = await db
  .select()
  .from(cases)
  .leftJoin(users, eq(cases.assignedProsecutorId, users.id));

// Search evidence
const searchResults = await db
  .select()
  .from(evidence)
  .where(ilike(evidence.title, '%search term%'));
```

## 🐛 Troubleshooting

### Container Issues
```bash
# Reset containers
docker compose down -v
docker compose up -d

# Check logs
docker compose logs postgres
```

### Connection Issues
```bash
# Test connection
docker compose exec postgres psql -U postgres -d prosecutor_app -c "SELECT version();"
```

### Schema Issues
```bash
# Check current schema
npx drizzle-kit introspect

# Force schema sync
npx drizzle-kit push --force
```

---

This shared database setup ensures all apps in the monorepo use the same schema and can share data seamlessly. 🎯
