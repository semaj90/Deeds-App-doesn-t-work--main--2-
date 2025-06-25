import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

function createDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined in your environment.');
  }

  if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    throw new Error('Desktop app requires PostgreSQL database. Please use postgresql:// URL format.');
  }

  console.log('� Using PostgreSQL database');
  const pool = new Pool({
    connectionString: databaseUrl
  });
  
  return drizzle(pool, { schema });
}

export const db = createDatabase();

// Re-export all schema types and tables
export * from './schema';
