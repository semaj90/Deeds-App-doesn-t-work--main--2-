import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { DATABASE_URL } from '$env/static/private';
import * as schema from './schema';

if (!DATABASE_URL) {
	throw new Error('DATABASE_URL environment variable is not set.');
}

// For the web-app, we assume DATABASE_URL is for PostgreSQL
// and DATABASE_DIALECT (if used by schema.ts) is set to 'postgres' in the environment.
console.log('Connecting to PostgreSQL database for web-app...');
const client = postgres(DATABASE_URL);

export const db = drizzle(client, { schema, logger: process.env.NODE_ENV === 'development' });

export type DbClient = typeof db;

// Re-export schema
export * from './schema';
