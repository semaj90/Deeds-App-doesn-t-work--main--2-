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
  caseNumber: varchar('case_number', { length: 50 }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  incidentDate: timestamp('incident_date', { mode: 'date' }),
  location: text('location'),
  priority: varchar('priority', { length: 20 }).default('medium').notNull(),
  status: varchar('status', { length: 20 }).default('open').notNull(),
  category: varchar('category', { length: 50 }),
  tags: jsonb('tags').default([]).notNull(),
  aiSummary: text('ai_summary'),
  aiTags: jsonb('ai_tags').default([]).notNull(),
  assignedTo: uuid('assigned_to').references(() => users.id),
  createdBy: uuid('created_by').references(() => users.id),
  lastModifiedBy: uuid('last_modified_by').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// === EVIDENCE MANAGEMENT ===

export const evidence = pgTable('evidence', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade' }),
  evidenceNumber: varchar('evidence_number', { length: 50 }),
  type: varchar('type', { length: 50 }).notNull(),
  description: text('description'),
  location: text('location'),
  dateCollected: timestamp('date_collected', { mode: 'date' }),
  collectedBy: varchar('collected_by', { length: 255 }),
  chainOfCustody: jsonb('chain_of_custody').default([]).notNull(),
  fileUrl: text('file_url'),
  tags: jsonb('tags').default([]).notNull(),
  aiAnalysis: jsonb('ai_analysis').default({}).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// === STATUTES & LAWS ===

export const statutes = pgTable('statutes', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  statuteNumber: varchar('statute_number', { length: 50 }),
  jurisdiction: varchar('jurisdiction', { length: 100 }),
  chapter: varchar('chapter', { length: 50 }),
  section: varchar('section', { length: 50 }),
  text: text('text').notNull(),
  penalties: text('penalties'),
  category: varchar('category', { length: 100 }),
  tags: jsonb('tags').default([]).notNull(),
  lastUpdated: timestamp('last_updated', { mode: 'date' }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// === CRIME TYPES ===

export const crimes = pgTable('crimes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }),
  severity: varchar('severity', { length: 50 }),
  description: text('description'),
  statuteIds: jsonb('statute_ids').default([]).notNull(),
  commonElements: jsonb('common_elements').default([]).notNull(),
  typicalPenalties: text('typical_penalties'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// === REPORTS ===

export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  caseId: uuid('case_id').references(() => cases.id),
  content: text('content'),
  metadata: jsonb('metadata').default({}).notNull(),
  generatedBy: uuid('generated_by').references(() => users.id),
  generatedAt: timestamp('generated_at', { mode: 'date' }).defaultNow().notNull(),
});

// === AI ANALYSES ===

export const aiAnalyses = pgTable('ai_analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: varchar('entity_type', { length: 50 }).notNull(), // 'case', 'evidence', 'criminal'
  entityId: uuid('entity_id').notNull(),
  analysisType: varchar('analysis_type', { length: 50 }).notNull(),
  results: jsonb('results').notNull(),
  confidence: decimal('confidence', { precision: 5, scale: 4 }),
  modelVersion: varchar('model_version', { length: 50 }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// === SEARCH & TAGGING ===

export const searchTags = pgTable('search_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  category: varchar('category', { length: 50 }),
  color: varchar('color', { length: 7 }).default('#3B82F6'),
  description: text('description'),
  usageCount: integer('usage_count').default(0),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// === CASE EVENTS & TIMELINE ===

export const caseEvents = pgTable('case_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade' }),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  eventDate: timestamp('event_date', { mode: 'date' }),
  location: text('location'),
  participants: jsonb('participants').default([]).notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// === CASE RELATIONSHIPS ===

export const caseRelationships = pgTable('case_relationships', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentCaseId: uuid('parent_case_id').references(() => cases.id, { onDelete: 'cascade' }),
  childCaseId: uuid('child_case_id').references(() => cases.id, { onDelete: 'cascade' }),
  relationshipType: varchar('relationship_type', { length: 50 }).notNull(),
  description: text('description'),
  confidence: decimal('confidence', { precision: 5, scale: 4 }),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// === ADDITIONAL TABLES FOR ADVANCED FEATURES ===

export const caseRelationshipFeedback = pgTable('case_relationship_feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  relationshipId: uuid('relationship_id').references(() => caseRelationships.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  isAccurate: boolean('is_accurate').notNull(),
  feedback: text('feedback'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const savedStatements = pgTable('saved_statements', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const caseTextFragments = pgTable('case_text_fragments', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  startIndex: integer('start_index'),
  endIndex: integer('end_index'),
  type: varchar('type', { length: 50 }),
  tags: jsonb('tags').default([]).notNull(),
  aiClassification: jsonb('ai_classification').default({}).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const nlpAnalysisCache = pgTable('nlp_analysis_cache', {
  id: uuid('id').primaryKey().defaultRandom(),
  inputHash: varchar('input_hash', { length: 64 }).notNull().unique(),
  analysisType: varchar('analysis_type', { length: 50 }).notNull(),
  result: jsonb('result').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { mode: 'date' }),
});

export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  preferences: jsonb('preferences').default({}).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const caseTemplates = pgTable('case_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  template: jsonb('template').notNull(),
  category: varchar('category', { length: 100 }),
  isPublic: boolean('is_public').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const evidenceFiles = pgTable('evidence_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  evidenceId: uuid('evidence_id').references(() => evidence.id, { onDelete: 'cascade' }),
  filename: varchar('filename', { length: 255 }).notNull(),
  filesize: integer('filesize'),
  mimetype: varchar('mimetype', { length: 100 }),
  fileHash: varchar('file_hash', { length: 64 }),
  storagePath: text('storage_path'),
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  uploadedAt: timestamp('uploaded_at', { mode: 'date' }).defaultNow().notNull(),
});

export const evidenceAnchorPoints = pgTable('evidence_anchor_points', {
  id: uuid('id').primaryKey().defaultRandom(),
  evidenceFileId: uuid('evidence_file_id').references(() => evidenceFiles.id, { onDelete: 'cascade' }),
  pageNumber: integer('page_number'),
  xCoordinate: decimal('x_coordinate', { precision: 10, scale: 6 }),
  yCoordinate: decimal('y_coordinate', { precision: 10, scale: 6 }),
  width: decimal('width', { precision: 10, scale: 6 }),
  height: decimal('height', { precision: 10, scale: 6 }),
  annotation: text('annotation'),
  type: varchar('type', { length: 50 }),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const caseEvidenceSummaries = pgTable('case_evidence_summaries', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade' }),
  summary: text('summary').notNull(),
  evidenceCount: integer('evidence_count').default(0),
  lastUpdated: timestamp('last_updated', { mode: 'date' }).defaultNow().notNull(),
  generatedBy: uuid('generated_by').references(() => users.id),
});

export const contentEmbeddings = pgTable('content_embeddings', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  contentType: varchar('content_type', { length: 50 }).notNull(),
  embedding: jsonb('embedding').notNull(),
  text: text('text').notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const lawParagraphs = pgTable('law_paragraphs', {
  id: uuid('id').primaryKey().defaultRandom(),
  statuteId: uuid('statute_id').references(() => statutes.id, { onDelete: 'cascade' }),
  paragraphNumber: varchar('paragraph_number', { length: 10 }),
  content: text('content').notNull(),
  subsection: varchar('subsection', { length: 10 }),
  category: varchar('category', { length: 100 }),
  embedding: jsonb('embedding'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const caseCriminals = pgTable('case_criminals', {
  caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade' }),
  criminalId: uuid('criminal_id').references(() => criminals.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }), // 'suspect', 'defendant', 'witness', etc.
  notes: text('notes'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.caseId, table.criminalId] }),
}));

// === PERSONALIZED RAG TABLES ===

// Table to store user's saved/bookmarked content for personalization
export const savedItems = pgTable('saved_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  sourceType: varchar('source_type', { length: 50 }).notNull(), // 'case', 'statute', 'evidence', 'note'
  sourceId: uuid('source_id'), // Reference to the original source
  tags: jsonb('tags').default([]).notNull(),
  personalNotes: text('personal_notes'), // User's private notes
  embedding: jsonb('embedding'), // Embedding for similarity search
  priority: integer('priority').default(1).notNull(), // User-assigned priority (1-5)
  isPrivate: boolean('is_private').default(true).notNull(), // Private to user vs shared
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// Table to store chunks/snippets from saved items for better retrieval
export const savedItemSourceChunks = pgTable('saved_item_source_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  savedItemId: uuid('saved_item_id').notNull().references(() => savedItems.id, { onDelete: 'cascade' }),
  chunkText: text('chunk_text').notNull(),
  chunkIndex: integer('chunk_index').notNull(), // Position within the saved item
  embedding: jsonb('embedding').notNull(),
  metadata: jsonb('metadata').default({}).notNull(), // Page numbers, section refs, etc.
  relevanceScore: decimal('relevance_score', { precision: 5, scale: 4 }), // How relevant this chunk is
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// Table to store user feedback on AI responses for continuous improvement
export const userFeedback = pgTable('user_feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  query: text('query').notNull(), // Original user query
  response: text('response').notNull(), // AI response that was given
  rating: integer('rating'), // 1-5 rating by user
  feedback: text('feedback'), // User's textual feedback
  improvedResponse: text('improved_response'), // User's correction/improvement
  context: jsonb('context').default({}).notNull(), // Context data (retrieved chunks, model used, etc.)
  wasFixed: boolean('was_fixed').default(false).notNull(), // Whether this feedback led to improvements
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// Table to store user's personalized search preferences and filters
export const userSearchPreferences = pgTable('user_search_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  preferredSources: jsonb('preferred_sources').default([]).notNull(), // ['cases', 'statutes', 'evidence', 'saved_items']
  excludedSources: jsonb('excluded_sources').default([]).notNull(),
  preferredTimeRange: jsonb('preferred_time_range').default({}).notNull(), // Date range preferences
  customPrompts: jsonb('custom_prompts').default({}).notNull(), // User's custom prompt templates
  searchHistory: jsonb('search_history').default([]).notNull(), // Recent search queries (limited)
  frequentTerms: jsonb('frequent_terms').default({}).notNull(), // Frequently used terms and their weights
  savedQueries: jsonb('saved_queries').default([]).notNull(), // User's saved/bookmarked queries
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// Table to store global knowledge base for cross-user insights (anonymized)
export const knowledgeBase = pgTable('knowledge_base', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  contentType: varchar('content_type', { length: 50 }).notNull(), // 'legal_principle', 'case_pattern', 'best_practice'
  category: varchar('category', { length: 100 }), // 'criminal_law', 'civil_procedure', 'evidence_handling'
  tags: jsonb('tags').default([]).notNull(),
  embedding: jsonb('embedding'),
  confidenceScore: decimal('confidence_score', { precision: 5, scale: 4 }), // Quality/confidence score
  sourceCount: integer('source_count').default(1).notNull(), // How many cases/users contributed to this
  verificationStatus: varchar('verification_status', { length: 50 }).default('pending').notNull(), // 'verified', 'pending', 'disputed'
  isPublic: boolean('is_public').default(true).notNull(),
  contributorIds: jsonb('contributor_ids').default([]).notNull(), // Anonymized list of contributing users
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

export type SavedItem = InferSelectModel<typeof savedItems>;
export type NewSavedItem = InferInsertModel<typeof savedItems>;

export type SavedItemSourceChunk = InferSelectModel<typeof savedItemSourceChunks>;
export type NewSavedItemSourceChunk = InferInsertModel<typeof savedItemSourceChunks>;

export type UserFeedback = InferSelectModel<typeof userFeedback>;
export type NewUserFeedback = InferInsertModel<typeof userFeedback>;

export type UserSearchPreferences = InferSelectModel<typeof userSearchPreferences>;
export type NewUserSearchPreferences = InferInsertModel<typeof userSearchPreferences>;

export type KnowledgeBase = InferSelectModel<typeof knowledgeBase>;
export type NewKnowledgeBase = InferInsertModel<typeof knowledgeBase>;

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
  caseCriminals,
  savedItems,
  savedItemSourceChunks,
  userFeedback,
  userSearchPreferences,
  knowledgeBase
};
