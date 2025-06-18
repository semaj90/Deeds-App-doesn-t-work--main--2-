import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined in your environment.');
}

// Determine database type and schema from URL
const isPostgres = databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://');
const isSQLite = databaseUrl.startsWith('file:');

let dialect: "postgresql" | "sqlite";
let schema: string;

if (isPostgres) {
  dialect = "postgresql";
  schema = "./web-app/sveltekit-frontend/src/lib/server/db/schema.ts";
} else if (isSQLite) {
  dialect = "sqlite";
  schema = "./src/lib/server/db/schema-sqlite.ts";
} else {
  throw new Error('Unsupported DATABASE_URL format. Use postgresql:// or file: prefix.');
}

export default defineConfig({
  dialect,
  schema,
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
});
