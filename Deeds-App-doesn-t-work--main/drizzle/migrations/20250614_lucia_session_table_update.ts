import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

/**
 * Migration: Update session table for Lucia compatibility
 * - Renames sessionToken -> id
 * - Renames expires -> expiresAt
 * - Keeps userId as is
 */
export async function up(db) {
  // Rename columns if they exist, otherwise create the table
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'session' AND column_name = 'sessionToken') THEN
        ALTER TABLE session RENAME COLUMN "sessionToken" TO id;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'session' AND column_name = 'expires') THEN
        ALTER TABLE session RENAME COLUMN "expires" TO "expiresAt";
      END IF;
    END $$;
  `);
}

export async function down(db) {
  // Optionally reverse the migration
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'session' AND column_name = 'id') THEN
        ALTER TABLE session RENAME COLUMN id TO "sessionToken";
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'session' AND column_name = 'expiresAt') THEN
        ALTER TABLE session RENAME COLUMN "expiresAt" TO expires;
      END IF;
    END $$;
  `);
}
