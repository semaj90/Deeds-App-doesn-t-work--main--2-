import { defineConfig } from 'drizzle-kit';

const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';

if (!databaseUrl.startsWith('file:')) {
  throw new Error(
    `Unsupported DATABASE_URL: "${databaseUrl}". This configuration only supports SQLite (file:).`
  );
}

export default defineConfig({
  dialect: 'sqlite',
  schema: './web-app/sveltekit-frontend/src/lib/server/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
});
