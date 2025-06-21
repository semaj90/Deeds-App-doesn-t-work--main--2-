// Shared Database Connection for SvelteKit App
// Connects to the monorepo shared PostgreSQL instance

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../../../../../db/schema';
import { env } from '$env/dynamic/private';

// Database connection string
const connectionString = env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/prosecutor_app';

// Create PostgreSQL client
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create Drizzle instance with shared schema
export const db = drizzle(client, { 
  schema,
  logger: env.NODE_ENV === 'development',
});

// Export schema for type inference
export * from '../../../../../../db/schema';

// Health check function
export async function checkDatabaseConnection() {
  try {
    await client`SELECT 1`;
    return { success: true, message: 'Database connection successful' };
  } catch (error) {
    console.error('Database connection failed:', error);
    return { success: false, message: 'Database connection failed', error };
  }
}

// Close connection (for cleanup)
export async function closeDatabaseConnection() {
  await client.end();
}
