import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

// User table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  hashedPassword: text('hashed_password').notNull(),
  bio: text('bio'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Case table
export const cases = sqliteTable('cases', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  createdBy: text('created_by').notNull(),
  status: text('status'),
  data: text('data', { mode: 'json' }), // JSON1 field for extra info
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Evidence table
export const evidence = sqliteTable('evidence', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull(),
  filename: text('filename'),
  tags: text('tags', { mode: 'json' }), // JSON1 field for tags
  uploadedBy: text('uploaded_by'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Law table
export const laws = sqliteTable('laws', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content'),
  meta: text('meta', { mode: 'json' }), // JSON1 field for metadata
});
