import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

// Read from environment variable, default to pg
const dialect = (process.env.DB_DIALECT as 'sqlite' | 'pg') || 'pg';

const commonConfig = {
  schema: './web-app/sveltekit-frontend/src/lib/server/db/schema-new.ts',
  strict: true,
  verbose: true,
};

const sqliteConfig = {
  dialect: 'sqlite',
  out: './drizzle/sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'file:./dev.db',
  },
};

const pgConfig = {
  dialect: 'postgresql',
  out: './drizzle/pg',
  dbCredentials: {
    url: process.env.DATABASE_URL || '', // Must be set for PostgreSQL
  },
};

export default defineConfig({
  ...commonConfig,
  ...(dialect === 'pg' ? pgConfig : sqliteConfig),
});
