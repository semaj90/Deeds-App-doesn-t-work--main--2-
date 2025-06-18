import { sql } from 'drizzle-orm';
import type { PgDatabase } from 'drizzle-orm/pg-core';

export async function up(db: PgDatabase) {
  await db.execute(sql`
    -- Drop existing primary key constraint from session table if it exists
    DO $$
    DECLARE
        pk_name text;
    BEGIN
        SELECT constraint_name INTO pk_name
        FROM information_schema.table_constraints
        WHERE table_name = 'session'
          AND constraint_type = 'PRIMARY KEY'
        LIMIT 1;
        IF pk_name IS NOT NULL THEN
            EXECUTE format('ALTER TABLE session DROP CONSTRAINT %I', pk_name);
        END IF;
    END $$;
  `);

  await db.execute(sql`
    -- Drop existing primary key constraint from authenticator table if it exists
    DO $$
    DECLARE
        pk_name text;
    BEGIN
        SELECT constraint_name INTO pk_name
        FROM information_schema.table_constraints
        WHERE table_name = 'authenticator'
          AND constraint_type = 'PRIMARY KEY'
        LIMIT 1;
        IF pk_name IS NOT NULL THEN
            EXECUTE format('ALTER TABLE authenticator DROP CONSTRAINT %I', pk_name);
        END IF;
    END $$;
  `);
}

export async function down(db: PgDatabase) {
  // Revert logic if necessary, though dropping PKs is usually not reverted directly
  // For simplicity, this down function will be empty or contain placeholder.
  // In a real scenario, you might re-add the PKs if they were dropped.
}