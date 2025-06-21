// Shared Drizzle Configuration for Prosecutor Monorepo
// Used for migrations and schema management across all apps

import type { Config } from 'drizzle-kit';
import { defineConfig } from 'drizzle-kit';

// Base configuration
const baseConfig = {
  // Schema files
  schema: './schema/index.ts',
  
  // Output directory for migrations
  out: './migrations',
  
  // Database driver
  dialect: 'postgresql' as const,
  
  // Migration settings
  migrations: {
    table: 'drizzle_migrations',
    schema: 'public',
  },
  
  // Schema filtering (optional)
  schemaFilter: ['public'],
  
  // Introspection settings
  introspect: {
    casing: 'preserve' as const,
  },
  
  // Verbose logging
  verbose: true,
  
  // Strict mode
  strict: true,
} satisfies Partial<Config>;

// Development config
export const developmentConfig = defineConfig({
  ...baseConfig,
  dbCredentials: {
    url: 'postgres://postgres:postgres@localhost:5432/prosecutor_app',
  },
});

// Production config
export const productionConfig = defineConfig({
  ...baseConfig,
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: false,
});

// Export default config (development)
export default developmentConfig;
