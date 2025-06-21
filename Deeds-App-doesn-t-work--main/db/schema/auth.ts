// Authentication & User Management Schema
// Shared across all apps in the prosecutor monorepo

import { pgTable, text, varchar, timestamp, jsonb, boolean, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { timestamps, createId } from './_shared';

// === USERS TABLE ===
export const users = pgTable('users', {
  id: createId(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  hashedPassword: text('hashed_password'),
  role: varchar('role', { length: 50 }).default('prosecutor').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  ...timestamps,
  
  // Profile fields
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  name: text('name'), // computed: firstName + lastName
  username: varchar('username', { length: 100 }),
  title: varchar('title', { length: 100 }), // e.g., "District Attorney", "Prosecutor"
  department: varchar('department', { length: 200 }),
  phone: varchar('phone', { length: 20 }),
  officeAddress: text('office_address'),
  avatar: text('avatar'),
  image: text('image'), // compatibility field  
  bio: text('bio'),
  specializations: jsonb('specializations').default([]).notNull(),
});

// === SESSIONS TABLE ===
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  ...timestamps,
});

// === VERIFICATION TOKENS ===
export const verificationToken = pgTable('verification_token', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

// === ACCOUNTS (OAuth) ===
export const account = pgTable('account', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: text('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
});

// === USER PREFERENCES ===
export const userPreferences = pgTable('user_preferences', {
  id: createId(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  theme: varchar('theme', { length: 20 }).default('light'),
  language: varchar('language', { length: 10 }).default('en'),
  notifications: jsonb('notifications').default({}).notNull(),
  ...timestamps,
});

// === RELATIONS ===
export const usersRelations = relations(users, ({ one, many }) => ({
  sessions: many(sessions),
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));
