import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  // Use unified schema for consistent database structure
  schema: './src/lib/server/db/unified-schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'prosecutor_app',
    ssl: false,
  },
  strict: true,
  verbose: true,
});
