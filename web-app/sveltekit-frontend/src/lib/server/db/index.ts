import { Pool } from 'pg';
import { type NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema'; // Use schema
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

// Export the pool for direct access if needed
export const pool = _pool;

// Graceful shutdown
async function gracefulShutdown() {
	if (_pool) {
		console.log('Closing database pool...');
		await _pool.end();
		console.log('Database pool closed.');
	}
}

// Listen for shutdown signals
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);