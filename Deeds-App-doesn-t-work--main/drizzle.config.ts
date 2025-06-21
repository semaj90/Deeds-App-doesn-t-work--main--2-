import { defineConfig } from 'drizzle-kit';
import { parse } from 'pg-connection-string';

const databaseUrl = process.env.DATABASE_URL || '';

if (!databaseUrl.startsWith('postgres')) {
  throw new Error(
    `Invalid DATABASE_URL: "${databaseUrl}". This configuration only supports PostgreSQL (must start with postgres://).`
  );
}

const dbConfig = parse(databaseUrl);

export default defineConfig({
  dialect: 'postgresql',
  schema: './web-app/sveltekit-frontend/src/lib/server/db/schema-new.ts',
  out: './drizzle',
  dbCredentials: {
    host: dbConfig.host || 'localhost',
    port: dbConfig.port ? parseInt(dbConfig.port, 10) : 5432,
    user: dbConfig.user || '',
    password: dbConfig.password || '',
    database: dbConfig.database || '',
    ssl: false, // Always disable SSL for local development
  },
  strict: true,
  verbose: true,
});
