import { Pool } from 'pg';
import { type NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './unified-schema'; // Use unified schema
import { building } from '$app/environment';
import { env } from '$env/dynamic/private';

let _db: NodePgDatabase<typeof schema> | null = null;
let _pool: Pool | null = null;

function initializeDatabase(): NodePgDatabase<typeof schema> | null {
	// Skip database initialization during SvelteKit build
	if (building) {
		console.log('Skipping database initialization during build');
		return null;
	}

	if (_db) return _db;

	// Use SvelteKit's env module within the app, which falls back to process.env in scripts
	const connectionString = env.DATABASE_URL || process.env.DATABASE_URL;

	if (!connectionString) {
		throw new Error('DATABASE_URL environment variable is not set.');
	}

	console.log('Connecting to database...');
	_pool = new Pool({
		connectionString,
		ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
	});

	_db = drizzle(_pool, { schema }); // Pass schema to drizzle

	console.log('Database connection established.');
	return _db;
}

export const db: NodePgDatabase<typeof schema> = new Proxy({} as NodePgDatabase<typeof schema>, {
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
				console.warn(`Database accessed during build phase. Method: ${String(prop)}`);
				return Promise.resolve([]);
			};
		}
		return (actualDb as any)[prop];
	}
});

export type DbClient = NodePgDatabase<typeof schema>;

export * from './unified-schema';

/**
 * Closes the database connection pool.
 * This is intended to be used in scripts to allow the process to exit gracefully.
 */
export async function closeDbConnection() {
	if (_pool) {
		console.log('Closing database connection pool...');
		await _pool.end();
		_pool = null;
		_db = null;
		console.log('Database connection pool closed.');
	}
}
