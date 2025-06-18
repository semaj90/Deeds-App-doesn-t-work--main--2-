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
  
  // Additional fields for compatibility
  username: varchar('username', { length: 100 }),
  image: text('image'),
  avatar_url: text('avatar_url'),
  provider: varchar('provider', { length: 50 }).default('credentials'),
  profile: jsonb('profile').default({}),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// === CRIMINAL RECORDS ===

export const criminals = pgTable('criminals', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  middleName: varchar('middle_name', { length: 100 }),
  aliases: jsonb('aliases').$type<string[]>().default([]).notNull(),
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
  priors: jsonb('priors').$type<string[]>().default([]).notNull(), // previous arrests/convictions
  convictions: jsonb('convictions').$type<string[]>().default([]).notNull(),
  notes: text('notes'),
  aiSummary: text('ai_summary'),
  aiTags: jsonb('ai_tags').$type<string[]>().default([]).notNull(),
  aiAnalysis: jsonb('ai_analysis').default({}).notNull(), // New field for AI analysis
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  
  // Additional missing fields for compatibility
  name: varchar('name', { length: 255 }),
  convictionStatus: varchar('conviction_status', { length: 50 }),
  sentenceLength: varchar('sentence_length', { length: 100 }),
  convictionDate: timestamp('conviction_date', { mode: 'date' }),
  escapeAttempts: integer('escape_attempts').default(0),
  gangAffiliations: text('gang_affiliations'),
});

// === CRIMES/CHARGES ===

export const crimes = pgTable('crimes', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade' }),
  criminalId: uuid('criminal_id').references(() => criminals.id, { onDelete: 'cascade' }),
  statuteId: uuid('statute_id').references(() => statutes.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  chargeLevel: varchar('charge_level', { length: 50 }), // felony, misdemeanor, etc.
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  incidentDate: timestamp('incident_date', { mode: 'date' }),
  arrestDate: timestamp('arrest_date', { mode: 'date' }),
  filingDate: timestamp('filing_date', { mode: 'date' }),
  notes: text('notes'),
  aiSummary: text('ai_summary'),
  metadata: jsonb('metadata').default({}).notNull(),
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
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  closedAt: timestamp('closed_at', { mode: 'date' }),
  
  // Additional missing fields for compatibility
  name: varchar('name', { length: 255 }),
  summary: text('summary'),
  dateOpened: timestamp('date_opened', { mode: 'date' }),
  verdict: varchar('verdict', { length: 100 }),
  courtDates: text('court_dates'),
  linkedCriminals: text('linked_criminals'),
  linkedCrimes: text('linked_crimes'),
  notes: text('notes'),
  tags: jsonb('tags').default([]).notNull(),
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
  tags: jsonb('tags').$type<string[]>().default([]).notNull(), // New field for tags
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  uploadedAt: timestamp('uploaded_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  
  // Additional missing fields for compatibility
  fileName: varchar('file_name', { length: 255 }),
  summary: text('summary'),
  aiSummary: text('ai_summary'),
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
  
  // Additional missing fields for compatibility
  name: varchar('name', { length: 255 }),
  sectionNumber: varchar('section_number', { length: 50 }),
});

export const lawParagraphs = pgTable('law_paragraphs', {
  id: uuid('id').primaryKey().defaultRandom(),
  statuteId: uuid('statute_id').notNull().references(() => statutes.id, { onDelete: 'cascade' }),
  paragraphNumber: varchar('paragraph_number', { length: 50 }).notNull(),
  content: text('content').notNull(),
  aiSummary: text('ai_summary'),
  tags: jsonb('tags').default([]).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  
  // Additional missing fields for compatibility
  paragraphText: text('paragraph_text'),
  anchorId: varchar('anchor_id', { length: 100 }),
  linkedCaseIds: jsonb('linked_case_ids').default([]).notNull(),
  crimeSuggestions: jsonb('crime_suggestions').default([]).notNull(),
});

export const caseLawLinks = pgTable('case_law_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  statuteId: uuid('statute_id').references(() => statutes.id),
  lawParagraphId: uuid('law_paragraph_id').references(() => lawParagraphs.id),
  linkType: varchar('link_type', { length: 50 }).notNull(), // e.g., "cited", "referenced", "applied"
  description: text('description'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const contentEmbeddings = pgTable('content_embeddings', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: varchar('entity_type', { length: 50 }).notNull(), // e.g., 'case', 'criminal', 'statute', 'evidence', 'lawParagraph'
  entityId: uuid('entity_id').notNull(), // ID of the entity (case, criminal, etc.)
  contentType: varchar('content_type', { length: 50 }).notNull(), // e.g., 'description', 'summary', 'fullText', 'notes'
  embedding: jsonb('embedding').notNull(), // Vector embedding
  text: text('text').notNull(), // The original text that was embedded
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// === CASE ACTIVITIES & TIMELINE (This is the new table that should be created) ===

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

// === LEGACY COMPATIBILITY ===
export const accounts = pgTable('account', {
  userId: uuid('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (table) => ({
  compoundKey: primaryKey({
    columns: [table.provider, table.providerAccountId],
  }),
}));

export const verificationTokens = pgTable('verificationToken', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (table) => ({
  compoundKey: primaryKey({ columns: [table.identifier, table.token] }),
}));

// === LEGACY COMPATIBILITY ===
export const userTable = users;
export const sessionTable = sessions;

// === RELATIONS ===
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  cases: many(cases),
  crimes: many(crimes),
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
  crimes: many(crimes),
  evidence: many(evidence),
  activities: many(caseActivities),
  caseLawLinks: many(caseLawLinks),
}));

export const criminalsRelations = relations(criminals, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [criminals.createdBy],
    references: [users.id],
  }),
  crimes: many(crimes),
  evidence: many(evidence),
}));

export const crimesRelations = relations(crimes, ({ one }) => ({
  case: one(cases, {
    fields: [crimes.caseId],
    references: [cases.id],
  }),
  criminal: one(criminals, {
    fields: [crimes.criminalId],
    references: [criminals.id],
  }),
  statute: one(statutes, {
    fields: [crimes.statuteId],
    references: [statutes.id],
  }),
  createdBy: one(users, {
    fields: [crimes.createdBy],
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

export const statutesRelations = relations(statutes, ({ many }) => ({
  lawParagraphs: many(lawParagraphs),
  caseLawLinks: many(caseLawLinks),
}));

export const lawParagraphsRelations = relations(lawParagraphs, ({ one, many }) => ({
  statute: one(statutes, {
    fields: [lawParagraphs.statuteId],
    references: [statutes.id],
  }),
  caseLawLinks: many(caseLawLinks),
}));

export const caseLawLinksRelations = relations(caseLawLinks, ({ one }) => ({
  case: one(cases, {
    fields: [caseLawLinks.caseId],
    references: [cases.id],
  }),
  statute: one(statutes, {
    fields: [caseLawLinks.statuteId],
    references: [statutes.id],
  }),
  lawParagraph: one(lawParagraphs, {
    fields: [caseLawLinks.lawParagraphId],
    references: [lawParagraphs.id],
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

export const contentEmbeddingsRelations = relations(contentEmbeddings, ({ one }) => ({
  // No direct relations to other tables as it references generic entityId
}));

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Criminal = typeof criminals.$inferSelect;
export type Case = typeof cases.$inferSelect;
export type Crime = typeof crimes.$inferSelect;
export type Evidence = typeof evidence.$inferSelect;
export type Statute = typeof statutes.$inferSelect;
export type LawParagraph = typeof lawParagraphs.$inferSelect;
export type CaseLawLink = typeof caseLawLinks.$inferSelect;
export type ContentEmbedding = typeof contentEmbeddings.$inferSelect;
export type CaseActivity = typeof caseActivities.$inferSelect;