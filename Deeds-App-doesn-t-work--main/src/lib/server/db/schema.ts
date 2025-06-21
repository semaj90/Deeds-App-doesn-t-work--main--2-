import {
  pgTable,
  text,
  varchar,
  integer,
  timestamp,
  jsonb,
  boolean,
  decimal,
  uuid,
  primaryKey
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// === AUTHENTICATION & USER MANAGEMENT ===
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  hashedPassword: text('hashed_password'),
  role: varchar('role', { length: 50 }).default('prosecutor').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  // Profile fields (merged for simplicity)
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  name: text('name'), // computed: firstName + lastName
  title: varchar('title', { length: 100 }), // e.g., "District Attorney", "Prosecutor"
  department: varchar('department', { length: 200 }),
  phone: varchar('phone', { length: 20 }),
  officeAddress: text('office_address'),
  avatar: text('avatar'),
  bio: text('bio'),
  specializations: jsonb('specializations').default([]).notNull(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
});

// === CRIMINAL RECORDS ===
export const criminals = pgTable('criminals', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  middleName: varchar('middle_name', { length: 100 }),
  aliases: jsonb('aliases').default([]).notNull(),
  dateOfBirth: timestamp('date_of_birth', { mode: 'date' }),
  address: text('address'),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  height: integer('height'), // in cm
  weight: integer('weight'), // in kg
  eyeColor: varchar('eye_color', { length: 20 }),
  hairColor: varchar('hair_color', { length: 20 }),
  distinguishingMarks: text('distinguishing_marks'),
  photoUrl: text('photo_url'),
  threatLevel: varchar('threat_level', { length: 20 }).default('low').notNull(),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  priors: jsonb('priors').default([]).notNull(), // previous arrests/convictions
  convictions: jsonb('convictions').default([]).notNull(),
  notes: text('notes'),
  aiSummary: text('ai_summary'),
  aiTags: jsonb('ai_tags').default([]).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// === CASE MANAGEMENT ===
export const cases = pgTable('cases', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseNumber: varchar('case_number', { length: 50 }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  incidentDate: timestamp('incident_date', { mode: 'date' }),
  location: text('location'),
  priority: varchar('priority', { length: 20 }).default('medium').notNull(),
  status: varchar('status', { length: 20 }).default('open').notNull(),
  category: varchar('category', { length: 50 }),
  dangerScore: integer('danger_score').default(0).notNull(),
  estimatedValue: decimal('estimated_value', { precision: 12, scale: 2 }),
  jurisdiction: varchar('jurisdiction', { length: 100 }),
  leadProsecutor: uuid('lead_prosecutor').references(() => users.id),
  assignedTeam: jsonb('assigned_team').default([]).notNull(),
  aiSummary: text('ai_summary'),
  aiTags: jsonb('ai_tags').default([]).notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  data: jsonb('data').default({}).notNull(), // <-- Added for compatibility with SQLite schema and app queries
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  closedAt: timestamp('closed_at', { mode: 'date' }),
});

// === EVIDENCE MANAGEMENT ===
export const evidence = pgTable('evidence', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade' }),
  criminalId: uuid('criminal_id').references(() => criminals.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  fileUrl: text('file_url'),
  fileType: varchar('file_type', { length: 100 }),
  fileSize: integer('file_size'),
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  uploadedAt: timestamp('uploaded_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// === STATUTES & LEGAL REFERENCES ===
export const statutes = pgTable('statutes', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  fullText: text('full_text'),
  category: varchar('category', { length: 100 }),
  severity: varchar('severity', { length: 20 }),
  minPenalty: varchar('min_penalty', { length: 255 }),
  maxPenalty: varchar('max_penalty', { length: 255 }),
  jurisdiction: varchar('jurisdiction', { length: 100 }),
  effectiveDate: timestamp('effective_date', { mode: 'date' }),
  aiSummary: text('ai_summary'),
  tags: jsonb('tags').default([]).notNull(),
  relatedStatutes: jsonb('related_statutes').default([]).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// === CASE ACTIVITIES & TIMELINE ===
export const caseActivities = pgTable('case_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  activityType: varchar('activity_type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  scheduledFor: timestamp('scheduled_for', { mode: 'date' }),
  completedAt: timestamp('completed_at', { mode: 'date' }),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  priority: varchar('priority', { length: 20 }).default('medium').notNull(),
  assignedTo: uuid('assigned_to').references(() => users.id),
  relatedEvidence: jsonb('related_evidence').default([]).notNull(),
  relatedCriminals: jsonb('related_criminals').default([]).notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// === CASE EVENTS (Event Store Pattern) ===
export const caseEvents = pgTable('case_events', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(), // 'created', 'evidence_added', 'status_changed', 'merged', 'text_moved'
  eventData: jsonb('event_data').notNull(),
  previousState: text('previous_state'),
  newState: text('new_state'),
  userId: text('user_id').references(() => users.id),
  sessionId: text('session_id'),
  metadata: jsonb('metadata').default({}).notNull(),
  timestamp: timestamp('timestamp').notNull().$defaultFn(() => new Date())
});

// === CASE RELATIONSHIPS ===
export const caseRelationships = pgTable('case_relationships', {
  id: text('id').primaryKey(),
  parentCaseId: text('parent_case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  relatedCaseId: text('related_case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  relationshipType: text('relationship_type').notNull(), // 'similar', 'merged_from', 'merged_into', 'related', 'duplicate'
  confidence: decimal('confidence', { precision: 4, scale: 3 }).default('0.0').notNull(), // NLP confidence score 0.0-1.0
  aiAnalysis: jsonb('ai_analysis').default({}).notNull(),
  description: text('description'),
  discoveredBy: text('discovered_by').notNull(), // 'user', 'nlp', 'auto'
  createdBy: text('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date()),
});

// === RELATIONS ===
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  cases: many(cases),
  evidence: many(evidence),
  createdCriminals: many(criminals),
  assignedActivities: many(caseActivities),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const casesRelations = relations(cases, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [cases.createdBy],
    references: [users.id],
  }),
  leadProsecutor: one(users, {
    fields: [cases.leadProsecutor],
    references: [users.id],
  }),
  evidence: many(evidence),
  activities: many(caseActivities),
}));

export const criminalsRelations = relations(criminals, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [criminals.createdBy],
    references: [users.id],
  }),
  evidence: many(evidence),
}));

export const evidenceRelations = relations(evidence, ({ one }) => ({
  case: one(cases, {
    fields: [evidence.caseId],
    references: [cases.id],
  }),
  criminal: one(criminals, {
    fields: [evidence.criminalId],
    references: [criminals.id],
  }),
  uploadedBy: one(users, {
    fields: [evidence.uploadedBy],
    references: [users.id],
  }),
}));

export const caseActivitiesRelations = relations(caseActivities, ({ one }) => ({
  case: one(cases, {
    fields: [caseActivities.caseId],
    references: [cases.id],
  }),
  assignedTo: one(users, {
    fields: [caseActivities.assignedTo],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [caseActivities.createdBy],
    references: [users.id],
  }),
}));

export const caseEventsRelations = relations(caseEvents, ({ one }) => ({
  case: one(cases, {
    fields: [caseEvents.caseId],
    references: [cases.id],
  }),
  user: one(users, {
    fields: [caseEvents.userId],
    references: [users.id],
  }),
  session: one(sessions, {
    fields: [caseEvents.sessionId],
    references: [sessions.id],
  }),
}));

export const caseRelationshipsRelations = relations(caseRelationships, ({ one }) => ({
  parentCase: one(cases, {
    fields: [caseRelationships.parentCaseId],
    references: [cases.id],
  }),
  relatedCase: one(cases, {
    fields: [caseRelationships.relatedCaseId],
    references: [cases.id],
  }),
  createdBy: one(users, {
    fields: [caseRelationships.createdBy],
    references: [users.id],
  }),
}));

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Criminal = typeof criminals.$inferSelect;
export type Case = typeof cases.$inferSelect;
export type Evidence = typeof evidence.$inferSelect;
export type Statute = typeof statutes.$inferSelect;
export type CaseActivity = typeof caseActivities.$inferSelect;