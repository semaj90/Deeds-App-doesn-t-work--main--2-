# Database Setup Guide

 and **PostgreSQL** (for production). You can easily switch between them using the provided scripts.

## Quick Start


2. **Run migrations**:
   ```bash
   npm run db:migrate
   ```

3. **Start the application**:
   ```bash
   npm run dev
   ```

### Using PostgreSQL (Production)

1. **Start PostgreSQL** (using Docker):
   ```bash
   npm run db:start
   ```

2. **Switch to PostgreSQL**:
   ```bash
   npm run switch-db postgres
   ```

3. **Update your `.env` file** with actual PostgreSQL credentials:
   ```env
   DATABASE_URL="postgresql://postgres:your_actual_password@localhost:5432/prosecutor_db"
   ```

4. **Run migrations**:
   ```bash
   npm run db:migrate
   ```

5. **Start the application**:
   ```bash
   npm run dev
   ```

## Database Commands

| Command | Description |
|---------|-------------|
| `npm run switch-db sqlite` | Switch to SQLite database |
| `npm run switch-db postgres` | Switch to PostgreSQL database |
| `npm run db:migrate` | Run database migrations |
| `npm run db:generate` | Generate new migration files |
| `npm run db:studio` | Open Drizzle Studio (database GUI) |
| `npm run db:push` | Push schema changes directly to database |
| `npm run db:reset` | Reset database (⚠️ destroys all data) |
| `npm run db:start` | Start PostgreSQL with Docker |

## Database Configurations

### SQLite Configuration
- **URL**: `file:./dev.db`
- **Location**: `./dev.db` in your project root
- **Schema**: `src/lib/server/db/schema-sqlite.ts`
- **Best for**: Development, testing, single-user scenarios

### PostgreSQL Configuration
- **URL**: `postgresql://user:password@host:port/database`
- **Schema**: `src/lib/server/db/schema-postgres.ts`
- **Best for**: Production, multi-user scenarios, advanced features

## Features by Database Type

### SQLite Features
✅ All basic CRUD operations  
✅ User authentication & sessions  
✅ Case management  
✅ Evidence tracking  
✅ File uploads  
✅ JSON data storage  
✅ Full-text search  

### PostgreSQL Features  
✅ All SQLite features  
✅ Advanced indexing  
✅ JSONB data types  
✅ Full ACID compliance  
✅ Connection pooling  
✅ Advanced constraints  
✅ Better concurrent access  

## Migration Strategy

The application automatically detects your database type and uses the appropriate schema:

1. **Database detection** happens in `src/lib/server/db/index.ts`
2. **Schema selection** is based on `DATABASE_URL` format
3. **Migrations** are generated for the currently configured database type

## Switching Between Databases

### From SQLite to PostgreSQL

1. Export your SQLite data (if needed):
   ```bash
   npm run db:studio  # Browse and export data manually
   ```

2. Switch to PostgreSQL:
   ```bash
   npm run switch-db postgres
   ```

3. Update your `.env` with PostgreSQL credentials

4. Run migrations:
   ```bash
   npm run db:migrate
   ```

### From PostgreSQL to SQLite

1. Export your PostgreSQL data (if needed)

2. Switch to SQLite:
   ```bash
   npm run switch-db sqlite
   ```

3. Run migrations:
   ```bash
   npm run db:migrate
   ```

## Troubleshooting

### Common Issues

1. **"DATABASE_URL is not defined"**
   - Make sure your `.env` file exists and has `DATABASE_URL` set
   - Run `npm run switch-db [sqlite|postgres]` to configure

2. **PostgreSQL connection errors**
   - Ensure PostgreSQL is running: `npm run db:start`
   - Check your credentials in `.env`
   - Verify the database exists

3. **SQLite file permissions**
   - Make sure the directory is writable
   - Check that `dev.db` isn't locked by another process

4. **Migration errors**
   - Try resetting: `npm run db:reset` (⚠️ destroys data)
   - Check your schema files for syntax errors
   - Ensure you're using the correct database type

### Getting Help

- Check the logs when running `npm run dev`
- Use `npm run db:studio` to inspect your database
- View migration files in `./drizzle/` directory

## Environment Variables

Make sure these are set in your `.env`:

```env
# Database (automatically set by switch-db script)
DATABASE_URL="file:./dev.db"  # or postgresql://...

# Required for authentication
AUTH_SECRET="your_secure_secret_here"
JWT_SECRET="your_jwt_secret_here"
SESSION_SECRET="your_session_secret_here"

# Optional
NODE_ENV=development
ORIGIN=http://localhost:5173
ENABLE_REGISTRATION=true
```

---

**Need more help?** Check the main README.md or the database schema files for implementation details.
