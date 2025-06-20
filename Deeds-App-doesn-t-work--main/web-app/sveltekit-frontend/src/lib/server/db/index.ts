import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { DATABASE_URL } from '$env/static/private';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

if (!DATABASE_URL) {
	throw new Error(
		'DATABASE_URL is not set. Please set it to a SQLite file path, e.g. "file:./dev.db" in your .env file.'
	);
}

if (!DATABASE_URL.startsWith('file:')) {
	throw new Error(
		`\n❌ Unsupported DATABASE_URL: ${DATABASE_URL}\n\nThis app is configured for SQLite only in local development.\n\n- Postgres and Qdrant are NOT required for local dev.\n- Set DATABASE_URL to a SQLite file path, e.g. "file:./dev.db" in your .env.\n- If you want to use Postgres, see the documentation for production setup.\n\n`
	);
}

const sqlitePath = DATABASE_URL.replace('file:', '');
const absoluteSqlitePath = path.join(process.cwd(), sqlitePath);

// Ensure the directory exists before attempting to open the database
const dbDir = path.dirname(absoluteSqlitePath);
if (!existsSync(dbDir)) {
	mkdirSync(dbDir, { recursive: true });
}

let sqlite;
try {
	sqlite = new Database(absoluteSqlitePath);
	sqlite.exec('PRAGMA journal_mode = WAL;'); // Enable WAL mode for better concurrency
	sqlite.exec('PRAGMA foreign_keys = ON;'); // Enable foreign key constraints
	sqlite.loadExtension('./json1'); // Attempt to load the json1 extension
	console.log('SQLite database connected and json1 extension loaded successfully.');
} catch (error: any) {
	console.error(`Failed to open SQLite database or load extension: ${error.message}`);
	throw error;
}

export const db = drizzle(sqlite, { schema });
export type DbClient = typeof db;

export * from './schema';
