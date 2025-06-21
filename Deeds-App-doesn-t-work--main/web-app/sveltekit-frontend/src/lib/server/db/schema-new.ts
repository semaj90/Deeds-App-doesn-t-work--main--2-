// === MAIN SCHEMA FOR PROSECUTOR CASE MANAGEMENT ===
// This schema combines modern auth with comprehensive case management

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
import { relations, sql } from 'drizzle-orm';

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
  username: varchar('username', { length: 100 }), // added for compatibility
  title: varchar('title', { length: 100 }), // e.g., "District Attorney", "Prosecutor"
  department: varchar('department', { length: 200 }),
  phone: varchar('phone', { length: 20 }),
  officeAddress: text('office_address'),
  avatar: text('avatar'),
  image: text('image'), // added for compatibility  
  bio: text('bio'),
  specializations: jsonb('specializations').default([]).notNull(),
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
  // Legacy/compatibility fields
  convictionStatus: varchar('conviction_status', { length: 50 }), // for compatibility
  sentenceLength: varchar('sentence_length', { length: 100 }), // for compatibility
  convictionDate: timestamp('conviction_date', { mode: 'date' }), // for compatibility
  escapeAttempts: integer('escape_attempts').default(0), // for compatibility
  gangAffiliations: text('gang_affiliations'), // for compatibility
  aiAnalysis: jsonb('ai_analysis').default({}).notNull(), // for compatibility
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
  // Legacy/compatibility fields
  data: jsonb('data').default({}).notNull(), // for compatibility
  tags: jsonb('tags').default([]).notNull(), // for compatibility
  embedding: jsonb('embedding'), // for compatibility
  name: varchar('name', { length: 255 }), // for compatibility (alias for title)
  summary: text('summary'), // for compatibility (alias for aiSummary)
  dateOpened: timestamp('date_opened', { mode: 'date' }), // for compatibility
  verdict: varchar('verdict', { length: 100 }), // for compatibility
  courtDates: text('court_dates'), // for compatibility
  linkedCriminals: text('linked_criminals'), // for compatibility
  linkedCrimes: text('linked_crimes'), // for compatibility
  notes: text('notes'), // for compatibility
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
  role: varchar('role', { length: 50 }).default('suspect').notNull(),
  charges: jsonb('charges').default([]).notNull(),
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
  evidenceType: varchar('evidence_type', { length: 50 }).notNull(),
  subType: varchar('sub_type', { length: 50 }),
  fileUrl: text('file_url'),
  fileName: varchar('file_name', { length: 255 }),
  filename: varchar('filename', { length: 255 }), // alias for compatibility
  fileType: varchar('file_type', { length: 50 }), // added for compatibility
  fileSize: integer('file_size'),
  filePath: text('file_path'), // added for compatibility
  mimeType: varchar('mime_type', { length: 100 }),
  hash: varchar('hash', { length: 128 }),
  chainOfCustody: jsonb('chain_of_custody').default([]).notNull(),
  collectedAt: timestamp('collected_at', { mode: 'date' }),
  collectedBy: varchar('collected_by', { length: 255 }),
  location: text('location'),
  labAnalysis: jsonb('lab_analysis').default({}).notNull(),
  aiAnalysis: jsonb('ai_analysis').default({}).notNull(),
  aiSummary: text('ai_summary'), // added for compatibility
  aiTags: jsonb('ai_tags').default([]).notNull(),
  tags: jsonb('tags').default([]).notNull(), // added for compatibility
  embedding: jsonb('embedding'), // added for compatibility
  originalContent: text('original_content'), // added for compatibility
  summary: text('summary'), // added for compatibility
  poiId: uuid('poi_id'), // added for compatibility (person of interest)
  isAdmissible: boolean('is_admissible').default(true).notNull(),
  confidentialityLevel: varchar('confidentiality_level', { length: 20 }).default('standard').notNull(),
  canvasPosition: jsonb('canvas_position').default({}).notNull(),
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  uploadedAt: timestamp('uploaded_at', { mode: 'date' }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(), // added for compatibility
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
  // Legacy/compatibility fields
  name: varchar('name', { length: 255 }), // for compatibility (alias for title)
  sectionNumber: varchar('section_number', { length: 50 }), // for compatibility
  content: text('content'), // for compatibility (alias for fullText)
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

// === AI & SEARCH METADATA ===

export const aiAnalyses = pgTable('ai_analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: varchar('entity_type', { length: 20 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  analysisType: varchar('analysis_type', { length: 50 }).notNull(),
  prompt: text('prompt'),
  response: jsonb('response').notNull(),
  confidence: varchar('confidence', { length: 10 }),
  model: varchar('model', { length: 100 }),
  version: varchar('version', { length: 20 }),
  processingTime: integer('processing_time'),
  tokens: integer('tokens'),
  cost: decimal('cost', { precision: 8, scale: 6 }),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const searchTags = pgTable('search_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: varchar('entity_type', { length: 20 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  tag: varchar('tag', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }),
  confidence: varchar('confidence', { length: 10 }),
  source: varchar('source', { length: 50 }),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// === EXPORT & REPORTING ===

export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  entityType: varchar('entity_type', { length: 20 }),
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

// === LEGACY COMPATIBILITY ===
// Keep some legacy exports for backward compatibility
export const userTable = users;
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

// === DRIZZLE RELATIONS ===

export const usersRelations = relations(users, ({ many }) => ({
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

// === CRIMES ===
export const crimes = pgTable('crimes', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  criminalId: uuid('criminal_id').references(() => criminals.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  statuteId: uuid('statute_id').references(() => statutes.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  name: text('name').notNull(),
  title: text('title'), // alias for name for compatibility
  description: text('description'),
  chargeLevel: varchar('charge_level', { length: 50 }),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  incidentDate: timestamp('incident_date', { mode: 'date' }),
  arrestDate: timestamp('arrest_date', { mode: 'date' }),
  filingDate: timestamp('filing_date', { mode: 'date' }),
  notes: text('notes'),
  aiSummary: text('ai_summary'),
  metadata: jsonb('metadata').default({}).notNull(),
  // Additional fields for compatibility
  category: varchar('category', { length: 100 }),
  jurisdiction: varchar('jurisdiction', { length: 100 }),
  minPenalty: varchar('min_penalty', { length: 255 }),
  maxPenalty: varchar('max_penalty', { length: 255 }),
  severity: varchar('severity', { length: 50 }),
  relatedStatutes: jsonb('related_statutes').default([]).notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// === LAW PARAGRAPHS ===
export const lawParagraphs = pgTable('law_paragraphs', {
  id: uuid('id').primaryKey().defaultRandom(),
  statuteId: uuid('statute_id').notNull().references(() => statutes.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  paragraphNumber: varchar('paragraph_number', { length: 50 }).notNull(),
  content: text('content').notNull(),
  aiSummary: text('ai_summary'),
  tags: jsonb('tags').default([]).notNull(),
  linkedCaseIds: jsonb('linked_case_ids').default([]).notNull(),
  crimeSuggestions: jsonb('crime_suggestions').default([]).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  paragraphText: text('paragraph_text'),
  anchorId: uuid('anchor_id'),
});

// === CONTENT EMBEDDINGS ===
export const contentEmbeddings = pgTable('content_embeddings', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id').notNull(),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  contentType: varchar('content_type', { length: 100 }).notNull(),
  embedding: jsonb('embedding').notNull(),
  text: text('text').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// === CASE EVENTS (Event Store Pattern) ===
export const caseEvents = pgTable('case_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  eventType: varchar('event_type', { length: 100 }).notNull(), // 'created', 'evidence_added', 'status_changed', 'merged', 'text_moved'
  eventData: jsonb('event_data').notNull(),
  previousState: text('previous_state'),
  newState: text('new_state'),
  userId: uuid('user_id').references(() => users.id),
  sessionId: text('session_id'),
  metadata: jsonb('metadata').default({}).notNull(),
  timestamp: timestamp('timestamp', { mode: 'date' }).defaultNow().notNull(),
});

// === CASE RELATIONSHIPS ===
export const caseRelationships = pgTable('case_relationships', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentCaseId: uuid('parent_case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  relatedCaseId: uuid('related_case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  relationshipType: varchar('relationship_type', { length: 100 }).notNull(), // 'similar', 'merged_from', 'merged_into', 'related', 'duplicate'
  confidence: varchar('confidence', { length: 10 }).default('0.0').notNull(), // NLP confidence score 0.0-1.0
  aiAnalysis: jsonb('ai_analysis').default({}).notNull(),
  description: text('description'),
  discoveredBy: varchar('discovered_by', { length: 50 }).notNull(), // 'user', 'nlp', 'auto'
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// === CASE RELATIONSHIP FEEDBACK ===
export const caseRelationshipFeedback = pgTable('case_relationship_feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentCaseId: uuid('parent_case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  relatedCaseId: uuid('related_case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  feedback: varchar('feedback', { length: 50 }).notNull(), // 'positive', 'negative', 'neutral'
  confidence: decimal('confidence', { precision: 3, scale: 2 }).default('0.0').notNull(),
  userScore: integer('user_score').notNull(), // -1, 0, 1 for negative, neutral, positive
  feedbackType: varchar('feedback_type', { length: 50 }).notNull(), // 'manual', 'implicit', 'explicit'
  context: jsonb('context').default({}).notNull(),
  sessionId: text('session_id'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// === SAVED STATEMENTS ===
export const savedStatements = pgTable('saved_statements', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: varchar('category', { length: 100 }).notNull(), // 'opening', 'closing', 'evidence_description', 'legal_argument'
  tags: jsonb('tags').default([]).notNull(),
  usageCount: integer('usage_count').default(0).notNull(),
  caseTypes: jsonb('case_types').default([]).notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  lastUsed: timestamp('last_used', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// === CASE TEXT FRAGMENTS ===
export const caseTextFragments = pgTable('case_text_fragments', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  fragmentType: varchar('fragment_type', { length: 100 }).notNull(), // 'description', 'evidence_note', 'legal_argument', 'custom'
  content: text('content').notNull(),
  position: integer('position').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  source: uuid('source'), // original case ID if moved from another case
  tags: jsonb('tags').default([]).notNull(),
  embedding: jsonb('embedding'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// === NLP ANALYSIS CACHE ===
export const nlpAnalysisCache = pgTable('nlp_analysis_cache', {
  id: uuid('id').primaryKey().defaultRandom(),
  contentHash: varchar('content_hash', { length: 255 }).notNull().unique(),
  contentType: varchar('content_type', { length: 100 }).notNull(), // 'case_description', 'evidence', 'statement'
  originalText: text('original_text').notNull(),
  analysis: jsonb('analysis').notNull(),
  entities: jsonb('entities').default([]).notNull(),
  sentiment: decimal('sentiment', { precision: 3, scale: 2 }),
  confidence: decimal('confidence', { precision: 3, scale: 2 }),
  suggestions: jsonb('suggestions').default([]).notNull(),
  relatedCases: jsonb('related_cases').default([]).notNull(),
  relatedStatutes: jsonb('related_statutes').default([]).notNull(),
  embedding: jsonb('embedding'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull().default(sql`NOW() + INTERVAL '7 days'`),
});

// === USER PREFERENCES ===
export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  preferenceType: varchar('preference_type', { length: 100 }).notNull(), // 'auto_complete', 'case_templates', 'nlp_settings'
  preferences: jsonb('preferences').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// === CASE TEMPLATES ===
export const caseTemplates = pgTable('case_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  caseType: varchar('case_type', { length: 100 }).notNull(),
  template: jsonb('template').notNull(), // template structure with fields
  fields: jsonb('fields').default([]).notNull(), // field definitions
  usageCount: integer('usage_count').default(0).notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// === MULTIMODAL EVIDENCE FILES ===
export const evidenceFiles = pgTable('evidence_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id').notNull().references(() => cases.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(),
  fileType: varchar('file_type', { length: 50 }).notNull(), // 'image', 'video', 'audio', 'document'
  fileSize: integer('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 255 }),
  duration: decimal('duration', { precision: 10, scale: 2 }), // for video/audio files in seconds
  dimensions: varchar('dimensions', { length: 50 }), // "width,height" for images/videos
  checksum: varchar('checksum', { length: 255 }), // for file integrity verification
  uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  processedAt: timestamp('processed_at', { mode: 'date' }),
  processingStatus: varchar('processing_status', { length: 50 }).default('pending').notNull(), // 'pending', 'processing', 'completed', 'failed'
  aiSummary: text('ai_summary'),
  aiAnalysis: jsonb('ai_analysis').default({}).notNull(),
  embedding: jsonb('embedding'),
  tags: jsonb('tags').default([]).notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  enhancedVersions: jsonb('enhanced_versions').default([]).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// === EVIDENCE ANCHOR POINTS ===
export const evidenceAnchorPoints = pgTable('evidence_anchor_points', {
  id: uuid('id').primaryKey().defaultRandom(),
  evidenceFileId: uuid('evidence_file_id').notNull().references(() => evidenceFiles.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  anchorType: varchar('anchor_type', { length: 50 }).notNull(), // 'object', 'text', 'audio_segment', 'timeline_event', 'custom'
  positionX: decimal('position_x', { precision: 5, scale: 4 }).notNull(), // Normalized 0-1 coordinates
  positionY: decimal('position_y', { precision: 5, scale: 4 }).notNull(),
  timestamp: decimal('timestamp', { precision: 10, scale: 2 }), // For video/audio anchors - time in seconds
  duration: decimal('duration', { precision: 10, scale: 2 }), // For time-based anchors - duration in seconds
  label: text('label').notNull(),
  description: text('description'),
  confidence: decimal('confidence', { precision: 3, scale: 2 }).default('0.0').notNull(),
  detectedObject: varchar('detected_object', { length: 255 }), // YOLO/CV detection class
  detectedText: text('detected_text'), // OCR extracted text
  boundingBox: varchar('bounding_box', { length: 100 }), // "x1,y1,x2,y2" for object detection
  legalRelevance: varchar('legal_relevance', { length: 50 }), // 'high', 'medium', 'low', 'unknown'
  userNotes: text('user_notes'),
  aiAnalysis: jsonb('ai_analysis').default({}).notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  verifiedBy: uuid('verified_by').references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  verifiedAt: timestamp('verified_at', { mode: 'date' }),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// === CASE EVIDENCE SUMMARIES ===
export const caseEvidenceSummaries = pgTable('case_evidence_summaries', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id').notNull().references(() => cases.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  evidenceFileId: uuid('evidence_file_id').references(() => evidenceFiles.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  summaryType: varchar('summary_type', { length: 100 }).notNull(), // 'scene_analysis', 'timeline_reconstruction', 'contradiction_analysis'
  title: text('title').notNull(),
  markdownContent: text('markdown_content').notNull(),
  plainTextContent: text('plain_text_content').notNull(),
  keyFindings: jsonb('key_findings').default([]).notNull(),
  legalImplications: jsonb('legal_implications').default([]).notNull(),
  contradictions: jsonb('contradictions').default([]).notNull(),
  timelineEvents: jsonb('timeline_events').default([]).notNull(),
  emotionalAnalysis: jsonb('emotional_analysis').default({}).notNull(),
  embedding: jsonb('embedding'),
  confidence: decimal('confidence', { precision: 3, scale: 2 }).default('0.0').notNull(),
  reviewStatus: varchar('review_status', { length: 50 }).default('pending').notNull(), // 'pending', 'reviewed', 'approved', 'disputed'
  reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  reviewedAt: timestamp('reviewed_at', { mode: 'date' }),
  reviewNotes: text('review_notes'),
  generatedBy: varchar('generated_by', { length: 50 }).default('ai').notNull(), // 'ai', 'user', 'hybrid'
  modelVersion: varchar('model_version', { length: 100 }), // Track which AI model version generated this
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// === TYPE EXPORTS FOR COMPATIBILITY ===

// Import the proper InferSelectModel type from drizzle-orm
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Export types for backward compatibility
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Case = InferSelectModel<typeof cases>;
export type NewCase = InferInsertModel<typeof cases>;

export type Criminal = InferSelectModel<typeof criminals>;
export type NewCriminal = InferInsertModel<typeof criminals>;

export type Evidence = InferSelectModel<typeof evidence>;
export type NewEvidence = InferInsertModel<typeof evidence>;

export type Statute = InferSelectModel<typeof statutes>;
export type NewStatute = InferInsertModel<typeof statutes>;

export type Crime = InferSelectModel<typeof crimes>;
export type NewCrime = InferInsertModel<typeof crimes>;

export type CaseEvent = InferSelectModel<typeof caseEvents>;
export type NewCaseEvent = InferInsertModel<typeof caseEvents>;

export type CaseRelationship = InferSelectModel<typeof caseRelationships>;
export type NewCaseRelationship = InferInsertModel<typeof caseRelationships>;

export type SavedStatement = InferSelectModel<typeof savedStatements>;
export type NewSavedStatement = InferInsertModel<typeof savedStatements>;

export type CaseTextFragment = InferSelectModel<typeof caseTextFragments>;
export type NewCaseTextFragment = InferInsertModel<typeof caseTextFragments>;

export type NlpAnalysisCache = InferSelectModel<typeof nlpAnalysisCache>;
export type NewNlpAnalysisCache = InferInsertModel<typeof nlpAnalysisCache>;

export type UserPreference = InferSelectModel<typeof userPreferences>;
export type NewUserPreference = InferInsertModel<typeof userPreferences>;

export type CaseTemplate = InferSelectModel<typeof caseTemplates>;
export type NewCaseTemplate = InferInsertModel<typeof caseTemplates>;

export type EvidenceFile = InferSelectModel<typeof evidenceFiles>;
export type NewEvidenceFile = InferInsertModel<typeof evidenceFiles>;

export type EvidenceAnchorPoint = InferSelectModel<typeof evidenceAnchorPoints>;
export type NewEvidenceAnchorPoint = InferInsertModel<typeof evidenceAnchorPoints>;

export type CaseEvidenceSummary = InferSelectModel<typeof caseEvidenceSummaries>;
export type NewCaseEvidenceSummary = InferInsertModel<typeof caseEvidenceSummaries>;

// === EXPORT DATABASE SCHEMA ===

// Export the database schema with relations for db.query
export const schema = {
  users,
  sessions,
  criminals,
  cases,
  evidence,
  statutes,
  crimes,
  reports,
  aiAnalyses,
  searchTags,
  caseEvents,
  caseRelationships,
  caseRelationshipFeedback,
  savedStatements,
  caseTextFragments,
  nlpAnalysisCache,
  userPreferences,
  caseTemplates,
  evidenceFiles,
  evidenceAnchorPoints,
  caseEvidenceSummaries,
  contentEmbeddings,
  lawParagraphs,
  caseCriminals
};
