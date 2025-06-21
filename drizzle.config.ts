import { defineConfig } from 'drizzle-kit';
import pgConfig from './pg.config';
import commonConfig from './common.config';

// Enforce Postgres only
export default defineConfig({
  ...commonConfig,
  ...pgConfig,
  schema: './web-app/sveltekit-frontend/src/lib/server/db/schema-new.ts',
  out: './drizzle',
  dialect: 'postgresql',
  strict: true,
  verbose: true,
});
