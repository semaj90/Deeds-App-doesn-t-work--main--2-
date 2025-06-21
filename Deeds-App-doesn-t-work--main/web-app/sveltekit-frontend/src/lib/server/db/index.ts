import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema-new'; // Ensure this points to the unified schema
import { readFileSync } from 'fs';
import { building } from '$app/environment';
import { env } from '$env/dynamic/private';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;

function initializeDatabase() {
	// Skip database initialization during SvelteKit build
	if (building) {
		console.log('Skipping database initialization during build');
		return null;
	}

	if (_db) return _db;

	// Use SvelteKit's env module within the app, which falls back to process.env in scripts
	const DATABASE_URL = env.DATABASE_URL;
	if (!DATABASE_URL) {
		throw new Error('DATABASE_URL is not set. Please set it in your .env file.');
	}

	const poolConfig: PoolConfig = {
		connectionString: DATABASE_URL,
		ssl: env.PG_SSL_CA_PATH
			? {
				ca: readFileSync(env.PG_SSL_CA_PATH).toString(),
				rejectUnauthorized: true
			}
			: false
	};

	console.log('Initializing PostgreSQL connection pool...');
	_pool = new Pool(poolConfig);

	_pool.on('error', (err) => {
		console.error('Unexpected error on idle client', err);
		process.exit(-1);
	});

	_db = drizzle(_pool, { schema, logger: true });
	console.log('✅ PostgreSQL database connected successfully.');
	return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
	get(target, prop) {
		const actualDb = initializeDatabase();
		if (!actualDb) {
			// Return a mock object during build to prevent errors
			return () => {
				console.warn(`Database accessed during build phase. Method: ${String(prop)}`);
				return Promise.resolve([]);
			};
		}
		return (actualDb as any)[prop];
	}
});

export type DbClient = typeof db;

export * from './schema-new';

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

interface PoolConfig {
	connectionString: string;
	ssl?: {
		ca: string;
		rejectUnauthorized: boolean;
	} | boolean;
}
