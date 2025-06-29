import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

// Load environment-specific config
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: envFile });

const databaseUrl = process.env.DATABASE_URL || 'sqlite:./dev.db';
const isSQLite = databaseUrl.startsWith('sqlite:');

console.log(`📊 Drizzle Config - Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📊 Database: ${isSQLite ? 'SQLite' : 'PostgreSQL'}`);

export default defineConfig({
  schema: isSQLite ? './src/lib/server/db/schema-sqlite.ts' : './src/lib/server/db/unified-schema.ts',
  out: './drizzle',
  dialect: isSQLite ? 'sqlite' : 'postgresql',
  dbCredentials: isSQLite 
    ? { url: databaseUrl.replace('sqlite:', '') }
    : databaseUrl.startsWith('postgresql://') 
      ? { url: databaseUrl }
      : { 
          host: 'localhost',
          port: 5432,
          user: 'postgres',
          password: 'postgres',
          database: 'prosecutor_db'
        },
  verbose: true,
  strict: true,
});
