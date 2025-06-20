import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { resolve, dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Use relative path to the database file
const databasePath = resolve('../../dev.db');
const dbDir = dirname(databasePath);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}
const sqlite = new Database(databasePath);

export const db = drizzle(sqlite, { schema });
