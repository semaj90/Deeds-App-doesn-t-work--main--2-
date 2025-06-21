import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema-new';
import { resolve, dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Use relative path to the database file
const databasePath = resolve('../../dev.db');
const dbDir = dirname(databasePath);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

// Commented out SQLite DB loader logic for PostgreSQL unification
// const sqlite = new Database(databasePath);
// export const db = drizzle(sqlite, { schema });

// Use only PostgreSQL DB loader from schema-new.ts
// Re-export the db from index.ts for backward compatibility
export { db } from './index';
export * from './schema-new';
