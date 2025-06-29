import Database from 'better-sqlite3';
import { Pool } from 'pg';
import { drizzle as sqliteDrizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { drizzle as pgDrizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { building } from '$app/environment';
import { migrate as sqliteMigrate } from 'drizzle-orm/better-sqlite3/migrator';
import { migrate as pgMigrate } from 'drizzle-orm/node-postgres/migrator';
import dotenv from 'dotenv';

// Load environment-specific variables
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: envFile });

let _db: BetterSQLite3Database<typeof schema> | NodePgDatabase<typeof schema> | null = null;
let _sqlite: Database.Database | null = null;
let _pool: Pool | null = null;

function initializeDatabase(): BetterSQLite3Database<typeof schema> | NodePgDatabase<typeof schema> | null {
	// Skip database initialization during SvelteKit build
	if (building) {
		console.log('Skipping database initialization during build');
		return null;
	}

	if (_db) return _db;

	const databaseUrl = process.env.DATABASE_URL || 'sqlite:./dev.db';
	const isSQLite = databaseUrl.startsWith('sqlite:');

	if (isSQLite) {
		// SQLite for development
		const dbPath = databaseUrl.replace('sqlite:', '');
		console.log('🗄️ Connecting to SQLite database:', dbPath);
		
		_sqlite = new Database(dbPath);
		_sqlite.pragma('journal_mode = WAL');
		
		_db = sqliteDrizzle(_sqlite, { schema });

		// Run SQLite migrations
		try {
			sqliteMigrate(_db as BetterSQLite3Database<typeof schema>, { migrationsFolder: './drizzle' });
			console.log('✅ SQLite migrations completed');
		} catch (error) {
			console.log('⚠️ SQLite migration warning:', error);
		}

		console.log('✅ SQLite database connection established');
	} else {
		// PostgreSQL for testing/production
		console.log('🐘 Connecting to PostgreSQL database:', databaseUrl);
		
		_pool = new Pool({
			connectionString: databaseUrl,
		});
		
		_db = pgDrizzle(_pool, { schema });

		// Run PostgreSQL migrations
		try {
			pgMigrate(_db as NodePgDatabase<typeof schema>, { migrationsFolder: './drizzle' });
			console.log('✅ PostgreSQL migrations completed');
		} catch (error) {
			console.log('⚠️ PostgreSQL migration warning:', error);
		}

		console.log('✅ PostgreSQL database connection established');
	}

	return _db;
}

// PostgreSQL left for production
// import { Pool } from 'pg';
// import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres';
// import { migrate as pgMigrate } from 'drizzle-orm/node-postgres/migrator';
// 
// let _pool: Pool | null = null;
// 
// function initializePostgreSQL(): NodePgDatabase<typeof schema> | null {
//   if (building) return null;
//   if (_db) return _db;
//   
//   _pool = new Pool({
//     host: process.env.DB_HOST || 'localhost',
//     port: parseInt(process.env.DB_PORT || '5432'),
//     user: process.env.DB_USER || 'postgres',
//     password: process.env.DB_PASSWORD || 'postgres',
//     database: process.env.DB_NAME || 'prosecutor_db',
//   });
//   
//   _db = pgDrizzle(_pool, { schema });
//   
//   try {
//     pgMigrate(_db, { migrationsFolder: './drizzle' });
//     console.log('✅ PostgreSQL migrations completed');
//   } catch (error) {
//     console.log('⚠️ PostgreSQL migration warning:', error);
//   }
//   
//   return _db;
// }

export const db: BetterSQLite3Database<typeof schema> | NodePgDatabase<typeof schema> = new Proxy({} as any, {
	get(target, prop) {
		const actualDb = initializeDatabase();
		if (!actualDb) {
			// Return a mock object during build to prevent errors
			if (prop === 'query') {
				return new Proxy(
					{},
					{
						get: (target, prop) => {
							return () => {
								console.warn(
									`Database accessed during build phase. Method: query.${String(prop)}`
								);
								return Promise.resolve([]);
							};
						}
					}
				);
			}
			return () => {
				console.warn(`Database accessed during build phase. Property: ${String(prop)}`);
				return Promise.resolve([]);
			};
		}
		if (typeof actualDb[prop as keyof typeof actualDb] === 'function') {
			return (actualDb[prop as keyof typeof actualDb] as Function).bind(actualDb);
		}
		return actualDb[prop as keyof typeof actualDb];
	}
});

// Export instances for direct access if needed
export const sqlite = _sqlite;
export const pool = _pool;

// Helper functions
export function isPostgreSQL(): boolean {
	const databaseUrl = process.env.DATABASE_URL || 'sqlite:./dev.db';
	return !databaseUrl.startsWith('sqlite:') && process.env.NODE_ENV !== 'development';
}

export function isSQLite(): boolean {
	return !isPostgreSQL();
}

export function hasVectorSearch(): boolean {
	return isPostgreSQL() && Boolean(process.env.QDRANT_URL);
}

// Graceful shutdown
function gracefulShutdown() {
	if (_sqlite) {
		console.log('Closing SQLite database...');
		_sqlite.close();
		console.log('✅ SQLite database closed.');
	}
	if (_pool) {
		console.log('Closing PostgreSQL pool...');
		_pool.end();
		console.log('✅ PostgreSQL pool closed.');
	}
}

// Listen for shutdown signals
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);