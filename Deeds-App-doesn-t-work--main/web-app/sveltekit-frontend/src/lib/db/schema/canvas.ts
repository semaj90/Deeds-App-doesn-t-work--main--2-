import { pgTable, serial, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const canvasStates = pgTable('canvas_states', {
  id: serial('id').primaryKey(),
  caseId: varchar('case_id', { length: 255 }).notNull(),
  canvasData: text('canvas_data').notNull(),
  imagePreview: text('image_preview'),
  metadata: text('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type CanvasState = typeof canvasStates.$inferSelect;
export type NewCanvasState = typeof canvasStates.$inferInsert;
