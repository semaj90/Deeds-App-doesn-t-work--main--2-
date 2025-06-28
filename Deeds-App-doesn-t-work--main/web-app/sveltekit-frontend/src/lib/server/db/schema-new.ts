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
  // Compatibility/legacy fields (optional, add if needed by app logic)
  tags: jsonb('tags').default([]),
  embedding: jsonb('embedding'),
  name: varchar('name', { length: 255 }),
  summary: text('summary'),
  dateOpened: timestamp('date_opened', { mode: 'date' }),
  verdict: varchar('verdict', { length: 100 }),
  courtDates: text('court_dates'),
  linkedCriminals: text('linked_criminals'),
  linkedCrimes: text('linked_crimes'),
  notes: text('notes'),
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
  fileType: varchar('file_type', { length: 100 }), // added for compatibility - increased for MIME types
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

// === ENHANCED REPORT BUILDER TABLES ===

export const prosecutorReports = pgTable('prosecutor_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(), // HTML content from contenteditable
  wordCount: integer('word_count').default(0),
  version: integer('version').default(1),
  templateId: uuid('template_id').references(() => reportTemplates.id),
  metadata: jsonb('metadata').default({}).notNull(),
  aiAnalysisId: uuid('ai_analysis_id').references(() => aiAnalyses.id),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const citationPoints = pgTable('citation_points', {
  id: uuid('id').primaryKey().defaultRandom(),
  label: varchar('label', { length: 100 }).notNull(), // e.g., "[1]", "[Smith v. State]"
  content: text('content').notNull(), // The actual citation text
  sourceType: varchar('source_type', { length: 20 }).notNull(), // case_law, statute, evidence, expert, custom
  sourceId: uuid('source_id'), // Reference to evidence, statute, etc.
  url: text('url'),
  page: integer('page'),
  embedding: jsonb('embedding'), // Vector embedding for semantic search
  tags: jsonb('tags').default([]).notNull(),
  caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade' }),
  reportId: uuid('report_id').references(() => prosecutorReports.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  synced: boolean('synced').default(false).notNull(), // For offline sync
});

export const reportCitations = pgTable('report_citations', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportId: uuid('report_id').notNull().references(() => prosecutorReports.id, { onDelete: 'cascade' }),
  citationId: uuid('citation_id').notNull().references(() => citationPoints.id, { onDelete: 'cascade' }),
  position: integer('position'), // Position in the report
  context: text('context'), // Surrounding text for context
  addedAt: timestamp('added_at', { mode: 'date' }).defaultNow().notNull(),
});

export const reportCanvasStates = pgTable('report_canvas_states', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportId: uuid('report_id').notNull().references(() => prosecutorReports.id, { onDelete: 'cascade' }),
  caseId: uuid('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  fabricJson: text('fabric_json').notNull(), // Serialized Fabric.js canvas state
  imagePreview: text('image_preview'), // Base64 data URL for thumbnail
  metadata: jsonb('metadata').default({}).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const evidenceMarkers = pgTable('evidence_markers', {
  id: uuid('id').primaryKey().defaultRandom(),
  canvasStateId: uuid('canvas_state_id').notNull().references(() => reportCanvasStates.id, { onDelete: 'cascade' }),
  evidenceId: uuid('evidence_id').notNull().references(() => evidence.id, { onDelete: 'cascade' }),
  x: integer('x').notNull(),
  y: integer('y').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  type: varchar('type', { length: 20 }).notNull(), // image, document, annotation
  label: text('label'),
  metadata: jsonb('metadata').default({}).notNull(),
});

export const canvasAnnotations = pgTable('canvas_annotations', {
  id: uuid('id').primaryKey().defaultRandom(),
  canvasStateId: uuid('canvas_state_id').notNull().references(() => reportCanvasStates.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 20 }).notNull(), // text, arrow, highlight, drawing
  data: jsonb('data').notNull(), // Flexible data for different annotation types
  position: jsonb('position').notNull(), // {x, y} coordinates
  style: jsonb('style').default({}).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const reportTemplates = pgTable('report_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }).notNull(), // discovery, motion, summary, closing, custom
  content: text('content').notNull(), // Template HTML
  canvasTemplate: jsonb('canvas_template'), // Partial canvas state
  metadata: jsonb('metadata').default({}).notNull(),
  isSystem: boolean('is_system').default(false).notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const reportAIAnalyses = pgTable('report_ai_analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportId: uuid('report_id').notNull().references(() => prosecutorReports.id, { onDelete: 'cascade' }),
  analysisType: varchar('analysis_type', { length: 50 }).notNull(), // summary, suggestions, citations, legal_issues, evidence_gaps
  input: text('input').notNull(), // The text that was analyzed
  output: text('output').notNull(), // AI-generated result
  confidence: decimal('confidence', { precision: 3, scale: 2 }),
  model: varchar('model', { length: 100 }).notNull(), // e.g., 'legal-bert', 'gpt-4', 'local-llm'
  processingTime: integer('processing_time'), // milliseconds
  context: jsonb('context').default({}).notNull(),
  tags: jsonb('tags').default([]).notNull(),
  approved: boolean('approved').default(false).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const userHistory = pgTable('user_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 50 }).notNull(), // report_created, citation_added, ai_suggestion_used, export_pdf
  entityType: varchar('entity_type', { length: 20 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  embedding: jsonb('embedding'), // For AI to understand user patterns
  timestamp: timestamp('timestamp', { mode: 'date' }).defaultNow().notNull(),
});

export const reportExportHistory = pgTable('report_export_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportId: uuid('report_id').notNull().references(() => prosecutorReports.id, { onDelete: 'cascade' }),
  format: varchar('format', { length: 10 }).notNull(), // pdf, docx, html, markdown
  options: jsonb('options').default({}).notNull(),
  fileUrl: text('file_url'),
  fileName: varchar('file_name', { length: 255 }),
  fileSize: integer('file_size'),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  error: text('error'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { mode: 'date' }),
});

// === CANVAS STATES ===

export const canvasStates = pgTable('canvas_states', {
  id: serial('id').primaryKey(),
  caseId: uuid('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  canvasData: text('canvas_data').notNull(),
  imagePreview: text('image_preview'),
  metadata: text('metadata'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});
