// PostgreSQL schema for production
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
  uuid
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// === AUTHENTICATION & USER MANAGEMENT ===

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  hashedPassword: text('hashed_password'),
  name: text('name'),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  avatarUrl: text('avatar_url'),
  role: varchar('role', { length: 50 }).default('prosecutor').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// === CASE MANAGEMENT ===

export const cases = pgTable('cases', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseNumber: varchar('case_number', { length: 50 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  description: text('description'),
  incidentDate: timestamp('incident_date', { mode: 'date' }),
  location: text('location'),
  priority: varchar('priority', { length: 20 }).default('medium').notNull(),
  status: varchar('status', { length: 20 }).default('open').notNull(),
  category: varchar('category', { length: 50 }),
  dangerScore: integer('danger_score').default(0).notNull(),
  estimatedValue: decimal('estimated_value', { precision: 12, scale: 2 }),
  jurisdiction: varchar('jurisdiction', { length: 100 }),
  leadProsecutor: uuid('lead_prosecutor'),
  assignedTeam: jsonb('assigned_team').default([]).notNull(),
  tags: jsonb('tags').default([]).notNull(),
  aiSummary: text('ai_summary'),
  aiTags: jsonb('ai_tags').default([]).notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  closedAt: timestamp('closed_at', { mode: 'date' }),
});

// === CRIMINAL RECORDS ===

export const criminals = pgTable('criminals', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  middleName: varchar('middle_name', { length: 100 }),
  aliases: jsonb('aliases').default([]).notNull(),
  dateOfBirth: timestamp('date_of_birth', { mode: 'date' }),
  placeOfBirth: varchar('place_of_birth', { length: 200 }),
  address: text('address'),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  socialSecurityNumber: varchar('ssn', { length: 11 }),
  driversLicense: varchar('drivers_license', { length: 50 }),
  height: integer('height'),
  weight: integer('weight'),
  eyeColor: varchar('eye_color', { length: 20 }),
  hairColor: varchar('hair_color', { length: 20 }),
  distinguishingMarks: text('distinguishing_marks'),
  photoUrl: text('photo_url'),
  fingerprints: jsonb('fingerprints').default({}),
  threatLevel: varchar('threat_level', { length: 20 }).default('low').notNull(),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  notes: text('notes'),
  aiSummary: text('ai_summary'),
  aiTags: jsonb('ai_tags').default([]).notNull(),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// === EVIDENCE MANAGEMENT ===

export const evidence = pgTable('evidence', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id'),
  criminalId: uuid('criminal_id'),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  evidenceType: varchar('evidence_type', { length: 50 }).notNull(),
  fileType: varchar('file_type', { length: 50 }),
  subType: varchar('sub_type', { length: 50 }),
  fileUrl: text('file_url'),
  fileName: varchar('file_name', { length: 255 }),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  hash: varchar('hash', { length: 128 }),
  tags: jsonb('tags').default([]).notNull(),
  chainOfCustody: jsonb('chain_of_custody').default([]).notNull(),
  collectedAt: timestamp('collected_at', { mode: 'date' }),
  collectedBy: varchar('collected_by', { length: 255 }),
  location: text('location'),
  labAnalysis: jsonb('lab_analysis').default({}).notNull(),
  aiAnalysis: jsonb('ai_analysis').default({}).notNull(),
  aiTags: jsonb('ai_tags').default([]).notNull(),
  aiSummary: text('ai_summary'),
  summary: text('summary'),
  isAdmissible: boolean('is_admissible').default(true).notNull(),
  confidentialityLevel: varchar('confidentiality_level', { length: 20 }).default('standard').notNull(),
  canvasPosition: jsonb('canvas_position').default({}).notNull(),
  uploadedBy: uuid('uploaded_by'),
  uploadedAt: timestamp('uploaded_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// === CASE ACTIVITIES & TIMELINE ===

export const caseActivities = pgTable('case_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id').notNull(),
  activityType: varchar('activity_type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  scheduledFor: timestamp('scheduled_for', { mode: 'date' }),
  completedAt: timestamp('completed_at', { mode: 'date' }),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  priority: varchar('priority', { length: 20 }).default('medium').notNull(),
  assignedTo: uuid('assigned_to'),
  relatedEvidence: jsonb('related_evidence').default([]).notNull(),
  relatedCriminals: jsonb('related_criminals').default([]).notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// === RELATIONSHIPS ===

export const usersRelations = relations(users, ({ many }) => ({
  casesAsLead: many(cases, { relationName: 'leadProsecutor' }),
  casesCreated: many(cases, { relationName: 'createdBy' }),
  evidenceUploaded: many(evidence),
  activitiesAssigned: many(caseActivities, { relationName: 'assignedTo' }),
  activitiesCreated: many(caseActivities, { relationName: 'createdBy' }),
  criminalsCreated: many(criminals),
}));

export const casesRelations = relations(cases, ({ one, many }) => ({
  leadProsecutor: one(users, {
    fields: [cases.leadProsecutor],
    references: [users.id],
    relationName: 'leadProsecutor',
  }),
  createdBy: one(users, {
    fields: [cases.createdBy],
    references: [users.id],
    relationName: 'createdBy',
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
  uploadedBy: one(users, {
    fields: [evidence.uploadedBy],
    references: [users.id],
  }),
  case: one(cases, {
    fields: [evidence.caseId],
    references: [cases.id],
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
    relationName: 'assignedTo',
  }),
  createdBy: one(users, {
    fields: [caseActivities.createdBy],
    references: [users.id],
    relationName: 'createdBy',
  }),
}));
