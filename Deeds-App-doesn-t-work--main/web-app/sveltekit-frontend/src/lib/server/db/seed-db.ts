// Remove SQLite file references and logic from seed-db.ts. Use only Postgres DB client
export { db } from './index';
export * from './schema-new';
