import { defineConfig } from 'drizzle-kit';

const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';

export default defineConfig({
  dialect: 'sqlite',
  schema: '../../web-app/sveltekit-frontend/src/lib/server/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
});
