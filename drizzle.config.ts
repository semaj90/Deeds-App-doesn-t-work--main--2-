import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

// Load environment variables
config();

// Enforce Postgres only
export default defineConfig({
  schema: './web-app/sveltekit-frontend/src/lib/server/db/schema-new.ts',
  out: './drizzle',
  dialect: 'postgresql',  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/prosecutor_db',
  },
  strict: true,
  verbose: true,
});
