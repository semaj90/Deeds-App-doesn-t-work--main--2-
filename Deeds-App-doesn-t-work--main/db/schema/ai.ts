// AI and Analytics Schema
// NLP analysis, content embeddings, and AI-powered features

import { pgTable, text, varchar, timestamp, jsonb, boolean, uuid, integer, decimal, vector } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { timestamps, createId, createStatusEnum } from './_shared';
import { users } from './auth';
import { cases } from './cases';
import { evidence } from './evidence';

// === AI ANALYSES ===
export const aiAnalyses = pgTable('ai_analyses', {
  id: createId(),
  
  // Source references
  sourceType: varchar('source_type', { length: 50 }).notNull(), // 'case', 'evidence', 'document', 'text'
  sourceId: uuid('source_id').notNull(),
  caseId: uuid('case_id').references(() => cases.id),
  
  // Analysis details
  analysisType: varchar('analysis_type', { length: 100 }).notNull(), // 'sentiment', 'entity', 'summary', 'classification'
  model: varchar('model', { length: 100 }),
  version: varchar('version', { length: 20 }),
  
  // Results
  result: jsonb('result').notNull(),
  confidence: decimal('confidence', { precision: 5, scale: 4 }),
  processingTime: integer('processing_time'), // milliseconds
  
  // Status
  status: createStatusEnum('status', ['pending', 'processing', 'completed', 'failed']),
  error: text('error'),
  
  // Metadata
  requestedBy: uuid('requested_by').references(() => users.id),
  parameters: jsonb('parameters').default({}).notNull(),
  
  ...timestamps,
});

// === CONTENT EMBEDDINGS ===
export const contentEmbeddings = pgTable('content_embeddings', {
  id: createId(),
  
  // Source
  contentType: varchar('content_type', { length: 50 }).notNull(), // 'text', 'image', 'audio', 'video'
  sourceId: uuid('source_id').notNull(),
  contentHash: varchar('content_hash', { length: 64 }).notNull(),
  
  // Embedding data
  embedding: vector('embedding', { dimensions: 1536 }), // OpenAI ada-002 dimensions
  model: varchar('model', { length: 100 }).notNull(),
  
  // Metadata
  contentLength: integer('content_length'),
  
  ...timestamps,
});

// === NLP ANALYSIS CACHE ===
export const nlpAnalysisCache = pgTable('nlp_analysis_cache', {
  id: createId(),
  
  // Input
  inputText: text('input_text').notNull(),
  inputHash: varchar('input_hash', { length: 64 }).notNull().unique(),
  
  // Analysis type and model
  analysisType: varchar('analysis_type', { length: 100 }).notNull(),
  model: varchar('model', { length: 100 }),
  parameters: jsonb('parameters').default({}).notNull(),
  
  // Results
  result: jsonb('result').notNull(),
  confidence: decimal('confidence', { precision: 5, scale: 4 }),
  processingTime: integer('processing_time'),
  
  // Cache management
  hitCount: integer('hit_count').default(0).notNull(),
  lastAccessed: timestamp('last_accessed', { mode: 'date' }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { mode: 'date' }).default(sql`NOW() + INTERVAL '7 days'`).notNull(),
  
  // Metadata
  tags: jsonb('tags').default([]).notNull(),
  
  ...timestamps,
});

// === SAVED STATEMENTS ===
export const savedStatements = pgTable('saved_statements', {
  id: createId(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  caseId: uuid('case_id').references(() => cases.id),
  
  // Statement details
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  statementType: varchar('statement_type', { length: 100 }),
  
  // Classification
  category: varchar('category', { length: 100 }),
  tags: jsonb('tags').default([]).notNull(),
  
  // Access control
  isPublic: boolean('is_public').default(false).notNull(),
  isTemplate: boolean('is_template').default(false).notNull(),
  
  ...timestamps,
});

// === CASE TEXT FRAGMENTS ===
export const caseTextFragments = pgTable('case_text_fragments', {
  id: createId(),
  caseId: uuid('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  evidenceId: uuid('evidence_id').references(() => evidence.id),
  
  // Fragment details
  content: text('content').notNull(),
  fragmentType: varchar('fragment_type', { length: 50 }), // 'ocr', 'transcript', 'manual', 'ai_extracted'
  
  // Position information
  pageNumber: integer('page_number'),
  startPosition: integer('start_position'),
  endPosition: integer('end_position'),
  
  // Analysis
  relevanceScore: decimal('relevance_score', { precision: 3, scale: 2 }),
  sentiment: varchar('sentiment', { length: 20 }),
  keyEntities: jsonb('key_entities').default([]).notNull(),
  
  // Metadata
  extractedBy: uuid('extracted_by').references(() => users.id),
  
  ...timestamps,
});

// === SEARCH TAGS ===
export const searchTags = pgTable('search_tags', {
  id: createId(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Tag details
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 7 }), // hex color
  description: text('description'),
  
  // Usage
  usageCount: integer('usage_count').default(0).notNull(),
  isSystemTag: boolean('is_system_tag').default(false).notNull(),
  
  ...timestamps,
});

// === RELATIONS ===
export const aiAnalysesRelations = relations(aiAnalyses, ({ one }) => ({
  case: one(cases, {
    fields: [aiAnalyses.caseId],
    references: [cases.id],
  }),
  requestedBy: one(users, {
    fields: [aiAnalyses.requestedBy],
    references: [users.id],
  }),
}));

export const savedStatementsRelations = relations(savedStatements, ({ one }) => ({
  user: one(users, {
    fields: [savedStatements.userId],
    references: [users.id],
  }),
  case: one(cases, {
    fields: [savedStatements.caseId],
    references: [cases.id],
  }),
}));

export const caseTextFragmentsRelations = relations(caseTextFragments, ({ one }) => ({
  case: one(cases, {
    fields: [caseTextFragments.caseId],
    references: [cases.id],
  }),
  evidence: one(evidence, {
    fields: [caseTextFragments.evidenceId],
    references: [evidence.id],
  }),
  extractedBy: one(users, {
    fields: [caseTextFragments.extractedBy],
    references: [users.id],
  }),
}));

export const searchTagsRelations = relations(searchTags, ({ one }) => ({
  user: one(users, {
    fields: [searchTags.userId],
    references: [users.id],
  }),
}));
