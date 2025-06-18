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
  role: varchar('role', { length: 50 }).default('prosecutor').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  title: varchar('title', { length: 100 }), // e.g., "District Attorney", "Prosecutor"
  department: varchar('department', { length: 200 }),
  phone: varchar('phone', { length: 20 }),
  officeAddress: text('office_address'),
  avatar: text('avatar'),
  bio: text('bio'),
  specializations: jsonb('specializations').default([]).notNull(), // areas of law
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// === CRIMINAL RECORDS ===

export const criminals = pgTable('criminals', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  middleName: varchar('middle_name', { length: 100 }),
  aliases: jsonb('aliases').default([]).notNull(), // string[]
  dateOfBirth: timestamp('date_of_birth', { mode: 'date' }),
  placeOfBirth: varchar('place_of_birth', { length: 200 }),
  address: text('address'),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  socialSecurityNumber: varchar('ssn', { length: 11 }), // encrypted
  driversLicense: varchar('drivers_license', { length: 50 }),
  height: integer('height'), // in cm
  weight: integer('weight'), // in kg
  eyeColor: varchar('eye_color', { length: 20 }),
  hairColor: varchar('hair_color', { length: 20 }),
  distinguishingMarks: text('distinguishing_marks'),
  photoUrl: text('photo_url'),
  fingerprints: jsonb('fingerprints').default({}),
  threatLevel: varchar('threat_level', { length: 20 }).default('low').notNull(), // low, medium, high, extreme
  status: varchar('status', { length: 20 }).default('active').notNull(), // active, deceased, incarcerated
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
  caseNumber: varchar('case_number', { length: 50 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  incidentDate: timestamp('incident_date', { mode: 'date' }),
  location: text('location'),
  priority: varchar('priority', { length: 20 }).default('medium').notNull(), // low, medium, high, urgent
  status: varchar('status', { length: 20 }).default('open').notNull(), // open, investigating, trial, closed, dismissed
  category: varchar('category', { length: 50 }), // felony, misdemeanor, etc.
  dangerScore: integer('danger_score').default(0).notNull(), // 0-100
  estimatedValue: decimal('estimated_value', { precision: 12, scale: 2 }), // monetary value involved
  jurisdiction: varchar('jurisdiction', { length: 100 }),
  leadProsecutor: uuid('lead_prosecutor').references(() => users.id),
  assignedTeam: jsonb('assigned_team').default([]).notNull(), // user IDs
  aiSummary: text('ai_summary'),
  aiTags: jsonb('ai_tags').default([]).notNull(),
  metadata: jsonb('metadata').default({}).notNull(), // flexible data storage
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  closedAt: timestamp('closed_at', { mode: 'date' }),
});

// === CASE-CRIMINAL RELATIONSHIPS ===

export const caseCriminals = pgTable('case_criminals', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  criminalId: uuid('criminal_id').notNull().references(() => criminals.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).default('suspect').notNull(), // suspect, defendant, witness, victim
  charges: jsonb('charges').default([]).notNull(), // array of charge objects
  conviction: boolean('conviction').default(false).notNull(),
  sentencing: jsonb('sentencing').default({}).notNull(),
  notes: text('notes'),
  addedBy: uuid('added_by').references(() => users.id),
  addedAt: timestamp('added_at', { mode: 'date' }).defaultNow().notNull(),
});

// === EVIDENCE MANAGEMENT ===

export const evidence = pgTable('evidence', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade' }),
  criminalId: uuid('criminal_id').references(() => criminals.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  evidenceType: varchar('evidence_type', { length: 50 }).notNull(), // document, photo, video, audio, physical, digital
  subType: varchar('sub_type', { length: 50 }), // specific type within category
  fileUrl: text('file_url'),
  fileName: varchar('file_name', { length: 255 }),
  fileSize: integer('file_size'), // in bytes
  mimeType: varchar('mime_type', { length: 100 }),
  hash: varchar('hash', { length: 128 }), // file integrity
  chainOfCustody: jsonb('chain_of_custody').default([]).notNull(),
  collectedAt: timestamp('collected_at', { mode: 'date' }),
  collectedBy: varchar('collected_by', { length: 255 }),
  location: text('location'), // where evidence was found
  labAnalysis: jsonb('lab_analysis').default({}).notNull(),
  aiAnalysis: jsonb('ai_analysis').default({}).notNull(),
  aiTags: jsonb('ai_tags').default([]).notNull(),
  isAdmissible: boolean('is_admissible').default(true).notNull(),
  confidentialityLevel: varchar('confidentiality_level', { length: 20 }).default('standard').notNull(),
  canvasPosition: jsonb('canvas_position').default({}).notNull(), // x, y, z for 3D canvas
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
  severity: varchar('severity', { length: 20 }), // misdemeanor, felony, infraction
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
  activityType: varchar('activity_type', { length: 50 }).notNull(), // court_date, evidence_added, witness_interview, etc.
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  scheduledFor: timestamp('scheduled_for', { mode: 'date' }),
  completedAt: timestamp('completed_at', { mode: 'date' }),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  priority: varchar('priority', { length: 20 }).default('medium').notNull(),
  assignedTo: uuid('assigned_to').references(() => users.id),
  relatedEvidence: jsonb('related_evidence').default([]).notNull(), // evidence IDs
  relatedCriminals: jsonb('related_criminals').default([]).notNull(), // criminal IDs
  metadata: jsonb('metadata').default({}).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// === AI & SEARCH METADATA ===

export const aiAnalyses = pgTable('ai_analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: varchar('entity_type', { length: 20 }).notNull(), // case, criminal, evidence
  entityId: uuid('entity_id').notNull(),
  analysisType: varchar('analysis_type', { length: 50 }).notNull(), // summary, sentiment, classification, etc.
  prompt: text('prompt'),
  response: jsonb('response').notNull(),
  confidence: decimal('confidence', { precision: 5, scale: 4 }), // 0.0000 to 1.0000
  model: varchar('model', { length: 100 }),
  version: varchar('version', { length: 20 }),
  processingTime: integer('processing_time'), // milliseconds
  tokens: integer('tokens'),
  cost: decimal('cost', { precision: 8, scale: 6 }), // API cost
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const searchTags = pgTable('search_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: varchar('entity_type', { length: 20 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  tag: varchar('tag', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }), // auto, manual, ai
  confidence: decimal('confidence', { precision: 5, scale: 4 }),
  source: varchar('source', { length: 50 }), // ai_model, user, ocr, etc.
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// === EXPORT & REPORTING ===

export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // case_summary, criminal_profile, evidence_report
  entityType: varchar('entity_type', { length: 20 }), // case, criminal, evidence
  entityId: uuid('entity_id'),
  template: varchar('template', { length: 50 }),
  format: varchar('format', { length: 10 }).default('pdf').notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  fileUrl: text('file_url'),
  parameters: jsonb('parameters').default({}).notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  generatedBy: uuid('generated_by').references(() => users.id),
  generatedAt: timestamp('generated_at', { mode: 'date' }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { mode: 'date' }),
});

// === RELATIONSHIPS ===

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles),
  sessions: many(sessions),
  casesAsLead: many(cases, { relationName: 'leadProsecutor' }),
  casesCreated: many(cases, { relationName: 'createdBy' }),
  evidenceUploaded: many(evidence),
  activitiesAssigned: many(caseActivities, { relationName: 'assignedTo' }),
  activitiesCreated: many(caseActivities, { relationName: 'createdBy' }),
  criminalsCreated: many(criminals),
  aiAnalyses: many(aiAnalyses),
  searchTags: many(searchTags),
  reports: many(reports),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
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
  criminals: many(caseCriminals),
  evidence: many(evidence),
  activities: many(caseActivities),
}));

export const criminalsRelations = relations(criminals, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [criminals.createdBy],
    references: [users.id],
  }),
  cases: many(caseCriminals),
  evidence: many(evidence),
}));

export const caseCriminalsRelations = relations(caseCriminals, ({ one }) => ({
  case: one(cases, {
    fields: [caseCriminals.caseId],
    references: [cases.id],
  }),
  criminal: one(criminals, {
    fields: [caseCriminals.criminalId],
    references: [criminals.id],
  }),
  addedBy: one(users, {
    fields: [caseCriminals.addedBy],
    references: [users.id],
  }),
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
    relationName: 'assignedTo',
  }),
  createdBy: one(users, {
    fields: [caseActivities.createdBy],
    references: [users.id],
    relationName: 'createdBy',
  }),
}));
