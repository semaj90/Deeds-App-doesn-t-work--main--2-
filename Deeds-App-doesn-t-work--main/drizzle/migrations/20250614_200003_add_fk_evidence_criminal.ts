import { sql } from 'drizzle-orm';
import type { PgDatabase } from 'drizzle-orm/pg-core';

export async function up(db: PgDatabase) {
  await db.execute(sql`
    DO $$ BEGIN
        ALTER TABLE evidence ADD CONSTRAINT evidence_criminal_id_criminals_id_fk FOREIGN KEY (criminal_id) REFERENCES criminals(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END $$;
  `);
}

export async function down(db: PgDatabase) {
  // Revert logic if necessary
}