import { drizzle as drizzlePostgres } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
function createDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined in your environment.');
  }

  // Determine database type from URL
  if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
    console.log('🐘 Using PostgreSQL database');
    const schema = require('./schema-postgres');
    const pool = new Pool({
      connectionString: databaseUrl
    });
    return drizzlePostgres(pool, { schema });
  else {
    throw new Error('Unsupported database URL format. Use postgresql:// or file: prefix.');
  }
}

export const db = createDatabase();

// Re-export the appropriate schema based on database type
const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl?.startsWith('postgresql://') || databaseUrl?.startsWith('postgres://')) {
  export * from './schema-postgres';
} else if (databaseUrl?.startsWith('file:')) {
  // Fallback to postgres schema for type definitions
  export * from './schema-postgres';
}
