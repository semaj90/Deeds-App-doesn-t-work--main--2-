// Shared database types and utilities for Prosecutor Monorepo
// Used across SvelteKit, Tauri, and Flutter apps

import { 
  pgTable, 
  text, 
  varchar, 
  integer, 
  timestamp, 
  jsonb, 
  boolean,
  decimal,
  serial,
  uuid,
  primaryKey
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Common timestamp function for all tables
export const timestamps = {
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
};

// Common ID patterns
export const createId = () => uuid('id').primaryKey().defaultRandom();
export const createSlugId = () => text('id').primaryKey();

// Utility for status enums
export const createStatusEnum = (name: string, values: string[]) => {
  return varchar(name, { length: 50 }).default(values[0]).notNull();
};
