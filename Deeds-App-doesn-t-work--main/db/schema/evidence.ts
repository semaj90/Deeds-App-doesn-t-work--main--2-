// Evidence Management Schema
// File uploads, evidence tracking, and processing

import { pgTable, text, varchar, timestamp, jsonb, boolean, uuid, integer, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { timestamps, createId, createStatusEnum } from './_shared';
import { users } from './auth';
import { cases } from './cases';

// === EVIDENCE TABLE ===
export const evidence = pgTable('evidence', {
  id: createId(),
  caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade' }),
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  
  // Basic file info
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  fileName: varchar('file_name', { length: 255 }),
  originalFileName: varchar('original_file_name', { length: 255 }),
  filePath: text('file_path'),
  fileSize: integer('file_size'),
  fileType: varchar('file_type', { length: 100 }), // Updated to varchar(100)
  mimeType: varchar('mime_type', { length: 100 }),
  
  // Evidence metadata
  evidenceType: varchar('evidence_type', { length: 100 }),
  status: createStatusEnum('status', ['pending', 'processed', 'verified', 'rejected']),
  priority: createStatusEnum('priority', ['low', 'medium', 'high', 'critical']),
  
  // Content analysis
  extractedText: text('extracted_text'),
  ocrText: text('ocr_text'),
  summary: text('summary'),
  
  // Media-specific fields
  duration: integer('duration'), // for video/audio in seconds
  resolution: varchar('resolution', { length: 50 }),
  frameRate: decimal('frame_rate', { precision: 5, scale: 2 }),
  
  // Processing status
  isProcessed: boolean('is_processed').default(false).notNull(),
  processedAt: timestamp('processed_at', { mode: 'date' }),
  processingStatus: varchar('processing_status', { length: 50 }),
  processingError: text('processing_error'),
  
  // Security and chain of custody
  chainOfCustody: jsonb('chain_of_custody').default([]).notNull(),
  accessLevel: varchar('access_level', { length: 50 }).default('restricted').notNull(),
  isConfidential: boolean('is_confidential').default(true).notNull(),
  
  // AI analysis
  aiAnalysis: jsonb('ai_analysis').default({}).notNull(),
  confidence: decimal('confidence', { precision: 3, scale: 2 }),
  
  // Geo and temporal data
  location: text('location'),
  capturedAt: timestamp('captured_at', { mode: 'date' }),
  
  // Metadata and tags
  metadata: jsonb('metadata').default({}).notNull(),
  tags: jsonb('tags').default([]).notNull(),
  
  ...timestamps,
});

// === EVIDENCE FILES (for multiple file attachments) ===
export const evidenceFiles = pgTable('evidence_files', {
  id: createId(),
  evidenceId: uuid('evidence_id').notNull().references(() => evidence.id, { onDelete: 'cascade' }),
  caseId: uuid('case_id').references(() => cases.id),
  
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  
  // File processing
  isProcessed: boolean('is_processed').default(false).notNull(),
  processedAt: timestamp('processed_at', { mode: 'date' }),
  
  // Media-specific
  duration: integer('duration'),
  thumbnailPath: text('thumbnail_path'),
  
  // Metadata
  metadata: jsonb('metadata').default({}).notNull(),
  
  ...timestamps,
});

// === EVIDENCE ANCHOR POINTS (for interactive evidence) ===
export const evidenceAnchorPoints = pgTable('evidence_anchor_points', {
  id: createId(),
  evidenceId: uuid('evidence_id').notNull().references(() => evidence.id, { onDelete: 'cascade' }),
  caseId: uuid('case_id').references(() => cases.id),
  createdBy: uuid('created_by').references(() => users.id),
  
  // Position data
  positionX: decimal('position_x', { precision: 10, scale: 6 }).notNull(),
  positionY: decimal('position_y', { precision: 10, scale: 6 }).notNull(),
  timestamp: integer('timestamp'), // for video/audio
  
  // Anchor details
  anchorType: varchar('anchor_type', { length: 50 }).notNull(), // 'object', 'text', 'audio_segment', 'timeline_event', 'custom'
  label: varchar('label', { length: 255 }).notNull(),
  description: text('description'),
  confidence: decimal('confidence', { precision: 3, scale: 2 }),
  
  // Relationships
  linkedEvidenceId: uuid('linked_evidence_id').references(() => evidence.id),
  linkedCaseId: uuid('linked_case_id').references(() => cases.id),
  
  // Metadata
  metadata: jsonb('metadata').default({}).notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  
  ...timestamps,
});

// === RELATIONS ===
export const evidenceRelations = relations(evidence, ({ one, many }) => ({
  case: one(cases, {
    fields: [evidence.caseId],
    references: [cases.id],
  }),
  uploader: one(users, {
    fields: [evidence.uploadedBy],
    references: [users.id],
  }),
  files: many(evidenceFiles),
  anchorPoints: many(evidenceAnchorPoints),
}));

export const evidenceFilesRelations = relations(evidenceFiles, ({ one }) => ({
  evidence: one(evidence, {
    fields: [evidenceFiles.evidenceId],
    references: [evidence.id],
  }),
  case: one(cases, {
    fields: [evidenceFiles.caseId],
    references: [cases.id],
  }),
}));

export const evidenceAnchorPointsRelations = relations(evidenceAnchorPoints, ({ one }) => ({
  evidence: one(evidence, {
    fields: [evidenceAnchorPoints.evidenceId],
    references: [evidence.id],
  }),
  case: one(cases, {
    fields: [evidenceAnchorPoints.caseId],
    references: [cases.id],
  }),
  creator: one(users, {
    fields: [evidenceAnchorPoints.createdBy],
    references: [users.id],
  }),
  linkedEvidence: one(evidence, {
    fields: [evidenceAnchorPoints.linkedEvidenceId],
    references: [evidence.id],
  }),
  linkedCase: one(cases, {
    fields: [evidenceAnchorPoints.linkedCaseId],
    references: [cases.id],
  }),
}));
