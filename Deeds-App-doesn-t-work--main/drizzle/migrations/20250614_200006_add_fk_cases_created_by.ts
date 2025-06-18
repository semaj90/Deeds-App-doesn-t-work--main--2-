import { sql } from 'drizzle-orm';
import type { PgDatabase } from 'drizzle-orm/pg-core';

export async function up(db: PgDatabase) {
  await db.execute(sql`
    DO $$
    BEGIN
        ALTER TABLE cases ADD CONSTRAINT cases_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END
    $$;
  `);
}

export async function down(db: PgDatabase) {
  // Revert logic if necessary
}