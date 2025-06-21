import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

await client.query(`
  ALTER TABLE cases ADD COLUMN IF NOT EXISTS status varchar(50) NOT NULL DEFAULT 'open';
`);

await client.end();

console.log('Migration complete: status column added to cases table.');
