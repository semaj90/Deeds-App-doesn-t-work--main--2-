import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  // Point to shared monorepo schema
  schema: '../../db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'prosecutor_app', // Updated to match shared database name
    ssl: false,
  },
  strict: true,
  verbose: true,
});
