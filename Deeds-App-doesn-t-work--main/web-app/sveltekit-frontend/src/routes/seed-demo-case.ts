import * as sqlite from 'drizzle-orm/sqlite-core';
import * as pg from 'drizzle-orm/pg-core';

// In your actual application, you would read this from process.env
// to decide which database dialect to use.
const DIALECT = process.env.DB_DIALECT as 'sqlite' | 'pg' || 'sqlite';

/**
 * Helper function to select the correct table creation function
 * based on the database dialect.
 */
export const table = DIALECT === 'pg' ? pg.pgTable : sqlite.sqliteTable;

// --- Common Column Types ---
// These types have a similar signature across dialects.
export const text = DIALECT === 'pg' ? pg.text : sqlite.text;
export const integer = DIALECT === 'pg' ? pg.integer : sqlite.integer;
export const real = DIALECT === 'pg' ? pg.real : sqlite.real;

// --- Dialect-Specific Column Abstractions ---
// These functions abstract away the differences between dialects for
// more complex types like timestamps, booleans, and JSON.

/**
 * Creates a timestamp column.
 * - In PostgreSQL, this uses `timestamp with time zone`.
 * - In SQLite, this uses an `integer` with `timestamp` mode.
 */
export const timestamp = (name: string) =>
  DIALECT === 'pg'
    ? pg.timestamp(name, { mode: 'date', withTimezone: true })
    : sqlite.integer(name, { mode: 'timestamp' });

/**
 * Creates a boolean column.
 * - In PostgreSQL, this uses the native `boolean` type.
 * - In SQLite, this uses an `integer` with `boolean` mode (0 or 1).
 */
export const boolean = (name: string) =>
  DIALECT === 'pg' ? pg.boolean(name) : sqlite.integer(name, { mode: 'boolean' });

/**
 * Creates a JSON column.
 * - In PostgreSQL, this uses the efficient `jsonb` type.
 * - In SQLite, this uses a `text` column with `json` mode.
 */
export const json = (name: string) =>
  DIALECT === 'pg' ? pg.jsonb(name) : sqlite.text(name, { mode: 'json' });

// This file is a utility for database schema creation, not meant to be executed
// To run the seed script, use: npx tsx scripts/seed-demo-case.ts