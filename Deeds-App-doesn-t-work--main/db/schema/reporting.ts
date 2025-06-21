// Reporting and System Schema
// Reports, system stats, and administrative tables

import { pgTable, text, varchar, timestamp, jsonb, boolean, uuid, integer, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { timestamps, createId, createStatusEnum } from './_shared';
import { users } from './auth';
import { cases } from './cases';

// === REPORTS ===
export const reports = pgTable('reports', {
  id: createId(),
  
  // Report details
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  reportType: varchar('report_type', { length: 100 }).notNull(), // 'case_summary', 'statistics', 'activity', 'custom'
  
  // Content
  content: jsonb('content').notNull(),
  format: varchar('format', { length: 20 }).default('json').notNull(), // 'json', 'pdf', 'excel', 'html'
  
  // Generation details
  generatedBy: uuid('generated_by').notNull().references(() => users.id),
  parameters: jsonb('parameters').default({}).notNull(),
  dateRange: jsonb('date_range'), // { start, end }
  
  // Filters and scope
  caseIds: jsonb('case_ids').default([]).notNull(),
  filters: jsonb('filters').default({}).notNull(),
  
  // Access control
  isPublic: boolean('is_public').default(false).notNull(),
  accessLevel: varchar('access_level', { length: 50 }).default('private').notNull(),
  
  // Status
  status: createStatusEnum('status', ['generating', 'completed', 'failed', 'expired']),
  
  ...timestamps,
});

// === CASE RELATIONSHIP FEEDBACK ===
export const caseRelationshipFeedback = pgTable('case_relationship_feedback', {
  id: createId(),
  
  // Source relationship
  parentCaseId: uuid('parent_case_id').notNull().references(() => cases.id),
  childCaseId: uuid('child_case_id').notNull().references(() => cases.id),
  suggestedRelationshipType: varchar('suggested_relationship_type', { length: 50 }),
  
  // Feedback
  providedBy: uuid('provided_by').notNull().references(() => users.id),
  feedback: varchar('feedback', { length: 20 }).notNull(), // 'correct', 'incorrect', 'partial'
  confidence: decimal('confidence', { precision: 3, scale: 2 }),
  
  // Additional info
  actualRelationshipType: varchar('actual_relationship_type', { length: 50 }),
  notes: text('notes'),
  
  // System learning
  isTrainingData: boolean('is_training_data').default(false).notNull(),
  
  ...timestamps,
});

// === CASE EVIDENCE SUMMARIES ===
export const caseEvidenceSummaries = pgTable('case_evidence_summaries', {
  id: createId(),
  caseId: uuid('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  
  // Summary details
  summaryType: varchar('summary_type', { length: 50 }).notNull(), // 'ai_generated', 'manual', 'hybrid'
  title: varchar('title', { length: 255 }),
  summary: text('summary').notNull(),
  
  // Content analysis
  keyFindings: jsonb('key_findings').default([]).notNull(),
  timeline: jsonb('timeline').default([]).notNull(),
  evidenceCount: integer('evidence_count').default(0).notNull(),
  
  // Quality metrics
  completeness: decimal('completeness', { precision: 3, scale: 2 }),
  accuracy: decimal('accuracy', { precision: 3, scale: 2 }),
  relevance: decimal('relevance', { precision: 3, scale: 2 }),
  
  // Processing details
  generatedBy: uuid('generated_by').references(() => users.id),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  approvedBy: uuid('approved_by').references(() => users.id),
  
  // Status
  status: createStatusEnum('status', ['draft', 'review', 'approved', 'rejected']),
  
  // Versioning
  version: integer('version').default(1).notNull(),
  previousVersionId: uuid('previous_version_id'),
  
  // Dates
  reviewedAt: timestamp('reviewed_at', { mode: 'date' }),
  approvedAt: timestamp('approved_at', { mode: 'date' }),
  
  // Metadata
  tags: jsonb('tags').default([]).notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  
  ...timestamps,
});

// === RELATIONS ===
export const reportsRelations = relations(reports, ({ one }) => ({
  generator: one(users, {
    fields: [reports.generatedBy],
    references: [users.id],
  }),
}));

export const caseRelationshipFeedbackRelations = relations(caseRelationshipFeedback, ({ one }) => ({
  parentCase: one(cases, {
    fields: [caseRelationshipFeedback.parentCaseId],
    references: [cases.id],
  }),
  childCase: one(cases, {
    fields: [caseRelationshipFeedback.childCaseId],
    references: [cases.id],
  }),
  provider: one(users, {
    fields: [caseRelationshipFeedback.providedBy],
    references: [users.id],
  }),
}));

export const caseEvidenceSummariesRelations = relations(caseEvidenceSummaries, ({ one }) => ({
  case: one(cases, {
    fields: [caseEvidenceSummaries.caseId],
    references: [cases.id],
  }),
  generator: one(users, {
    fields: [caseEvidenceSummaries.generatedBy],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [caseEvidenceSummaries.reviewedBy],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [caseEvidenceSummaries.approvedBy],
    references: [users.id],
  }),
}));
