// Database configuration and connection
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/prosecutor_app';

const pool = new Pool({
  connectionString,
});

export const db = drizzle(pool, { schema });

// Export schema and types
export * from './schema.js';

// Legacy exports for compatibility
export { schema };
