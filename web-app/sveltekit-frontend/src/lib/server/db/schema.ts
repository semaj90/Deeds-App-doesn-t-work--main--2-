import { table, text, integer, real, timestamp, boolean, json } from './columns';

// === USERS ===
export const users = table('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  hashedPassword: text('hashed_password').notNull(),
  bio: text('bio'),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date()),
});

// === CASES ===
export const cases = table('cases', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  createdBy: text('created_by').notNull().references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  status: text('status'),
  data: json('data').default('{}').notNull(),
  tags: json('tags').default('[]').notNull(),
  aiSummary: text('ai_summary'),
  aiTags: json('ai_tags').default('[]').notNull(),
  embedding: json('embedding'),
  dangerScore: integer('danger_score').default(0),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date()),
});

// === EVIDENCE ===
export const evidence = table('evidence', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().references(() => cases.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  filename: text('filename'),
  tags: json('tags').default('[]').notNull(),
  uploadedBy: text('uploaded_by').references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  embedding: json('embedding'),
  aiSummary: text('ai_summary'),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date()),
});

// === STATUTES ===
export const statutes = table('statutes', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content'),
  meta: json('meta').default('{}').notNull(),
  aiSummary: text('ai_summary'),
  tags: json('tags').default('[]').notNull(),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date()),
});

// === CONTENT EMBEDDINGS ===
export const contentEmbeddings = table('content_embeddings', {
  id: text('id').primaryKey(),
  entityId: text('entity_id').notNull(),
  entityType: text('entity_type').notNull(),
  contentType: text('content_type').notNull(),
  embedding: json('embedding').notNull(),
  text: text('text').notNull(),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
});

// === CRIMINALS ===
export const criminals = table('criminals', {
  id: text('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  middleName: text('middle_name'),
  aliases: json('aliases').default('[]').notNull(),
  address: text('address'),
  dateOfBirth: timestamp('date_of_birth'),
  phone: text('phone'),
  photoUrl: text('photo_url'), // Consider storing this in a dedicated file storage and linking the ID
  threatLevel: text('threat_level', { enum: ['low', 'medium', 'high', 'critical'] }).default('low').notNull(),
  status: text('status', { enum: ['active', 'inactive', 'incarcerated', 'at_large'] }).default('active').notNull(),
  priors: json('priors').default('[]').notNull(),
  convictions: json('convictions').default('[]').notNull(),
  notes: text('notes'),
  aiSummary: text('ai_summary'),
  aiTags: json('ai_tags').default('[]').notNull(),
  aiAnalysis: json('ai_analysis').default('{}').notNull(),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date()),
});

// === CRIMES ===
export const crimes = table('crimes', {
  id: text('id').primaryKey(),
  caseId: text('case_id').references(() => cases.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  criminalId: text('criminal_id').references(() => criminals.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  statuteId: text('statute_id').references(() => statutes.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  chargeLevel: text('charge_level'),
  status: text('status').default('pending').notNull(),
  incidentDate: timestamp('incident_date'),
  arrestDate: timestamp('arrest_date'),
  filingDate: timestamp('filing_date'),
  notes: text('notes'),
  aiSummary: text('ai_summary'),
  metadata: json('metadata').default('{}').notNull(),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date()),
});

// === LAW PARAGRAPHS ===
export const lawParagraphs = table('law_paragraphs', {
  id: text('id').primaryKey(),
  statuteId: text('statute_id').notNull().references(() => statutes.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  paragraphNumber: text('paragraph_number').notNull(),
  content: text('content').notNull(),
  aiSummary: text('ai_summary'),
  tags: json('tags').default('[]').notNull(),
  linkedCaseIds: json('linked_case_ids').default('[]').notNull(),
  crimeSuggestions: json('crime_suggestions').default('[]').notNull(),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date()),
  paragraphText: text('paragraph_text'),
  anchorId: text('anchor_id'),
});

// === CASE ACTIVITIES ===
export const caseActivities = table('case_activities', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().references(() => cases.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  activityType: text('activity_type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  scheduledFor: timestamp('scheduled_for'),
  completedAt: timestamp('completed_at'),
  status: text('status').default('pending').notNull(),
  priority: text('priority').default('medium').notNull(),
  assignedTo: text('assigned_to').references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  relatedEvidence: json('related_evidence').default('[]').notNull(),
  relatedCriminals: json('related_criminals').default('[]').notNull(),
  metadata: json('metadata').default('{}').notNull(),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date()),
});

// === CASE LAW LINKS ===
export const caseLawLinks = table('case_law_links', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().references(() => cases.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  statuteId: text('statute_id').references(() => statutes.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  lawParagraphId: text('law_paragraph_id').references(() => lawParagraphs.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  linkType: text('link_type').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date()),
});

// === SESSIONS ===
export const sessions = table('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
});

// === CASE EVENTS (Event Store Pattern) ===
export const caseEvents = table('case_events', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(), // 'created', 'evidence_added', 'status_changed', 'merged', 'text_moved'
  eventData: json('event_data').notNull(),
  previousState: text('previous_state'),
  newState: text('new_state'),
  userId: text('user_id').references(() => users.id),
  sessionId: text('session_id'),
  metadata: json('metadata').default('{}').notNull(),
  timestamp: timestamp('timestamp').notNull().$defaultFn(() => new Date())
});

// === CASE RELATIONSHIPS ===
export const caseRelationships = table('case_relationships', {
  id: text('id').primaryKey(),
  parentCaseId: text('parent_case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  relatedCaseId: text('related_case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  relationshipType: text('relationship_type').notNull(), // 'similar', 'merged_from', 'merged_into', 'related', 'duplicate'
  confidence: real('confidence').default(0.0).notNull(), // NLP confidence score 0.0-1.0
  aiAnalysis: json('ai_analysis').default('{}').notNull(),
  description: text('description'),
  discoveredBy: text('discovered_by').notNull(), // 'user', 'nlp', 'auto'
  createdBy: text('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date()),
});

// === CASE RELATIONSHIP FEEDBACK (User feedback for ML/NLP improvement) ===
export const caseRelationshipFeedback = table('case_relationship_feedback', {
  id: text('id').primaryKey(),
  parentCaseId: text('parent_case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  relatedCaseId: text('related_case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  feedback: text('feedback').notNull(), // 'positive', 'negative', 'neutral'
  confidence: real('confidence').default(0.0).notNull(), // Original AI confidence score
  userScore: integer('user_score').notNull(), // -1, 0, 1 for negative, neutral, positive
  feedbackType: text('feedback_type').notNull(), // 'manual', 'implicit', 'explicit'
  context: json('context').default('{}').notNull(), // Additional context data
  sessionId: text('session_id'), // For tracking feedback sessions
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date()),
});

// === SAVED STATEMENTS (Auto-completion templates) ===
export const savedStatements = table('saved_statements', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: text('category').notNull(), // 'opening', 'closing', 'evidence_description', 'legal_argument'
  tags: json('tags').default('[]').notNull(),
  usageCount: integer('usage_count').default(0).notNull(),
  caseTypes: json('case_types').default('[]').notNull(), // which case types this applies to
  isPublic: boolean('is_public').default(false).notNull(),
  createdBy: text('created_by').references(() => users.id),
  lastUsed: timestamp('last_used'),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date()),
});

// === CASE TEXT FRAGMENTS (For text moving between cases) ===
export const caseTextFragments = table('case_text_fragments', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  fragmentType: text('fragment_type').notNull(), // 'description', 'evidence_note', 'legal_argument', 'custom'
  content: text('content').notNull(),
  position: integer('position').default(0).notNull(), // for ordering within case
  isActive: boolean('is_active').default(true).notNull(),
  source: text('source'), // original case ID if moved from another case
  tags: json('tags').default('[]').notNull(),
  embedding: json('embedding'), // for semantic search
  createdBy: text('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date()),
});

// === NLP ANALYSIS CACHE ===
export const nlpAnalysisCache = table('nlp_analysis_cache', {
  id: text('id').primaryKey(),
  contentHash: text('content_hash').notNull().unique(), // hash of analyzed content
  contentType: text('content_type').notNull(), // 'case_description', 'evidence', 'statement'
  originalText: text('original_text').notNull(),
  analysis: json('analysis').notNull(),
  entities: json('entities').default('[]').notNull(),
  sentiment: real('sentiment'),
  confidence: real('confidence'),
  suggestions: json('suggestions').default('[]').notNull(),
  relatedCases: json('related_cases').default('[]').notNull(),
  relatedStatutes: json('related_statutes').default('[]').notNull(),
  embedding: json('embedding'),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
  expiresAt: timestamp('expires_at').notNull().$defaultFn(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days
});

// === USER PREFERENCES (for auto-completion and recommendations) ===
export const userPreferences = table('user_preferences', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  preferenceType: text('preference_type').notNull(), // 'auto_complete', 'case_templates', 'nlp_settings'
  preferences: json('preferences').notNull(),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date()),
});

// === CASE TEMPLATES (for auto-completion) ===
export const caseTemplates = table('case_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  caseType: text('case_type').notNull(),
  template: json('template').notNull(), // template structure with fields
  fields: json('fields').default('[]').notNull(), // field definitions
  usageCount: integer('usage_count').default(0).notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  createdBy: text('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date()),
});

// === MULTIMODAL EVIDENCE FILES ===
export const evidenceFiles = table('evidence_files', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().references(() => cases.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(),
  fileType: text('file_type').notNull(), // 'image', 'video', 'audio', 'document'
  fileSize: integer('file_size').notNull(),
  mimeType: text('mime_type'),
  duration: real('duration'), // for video/audio files in seconds
  dimensions: text('dimensions'), // "width,height" for images/videos
  checksum: text('checksum'), // for file integrity verification
  uploadedBy: text('uploaded_by').references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  processedAt: timestamp('processed_at'),
  processingStatus: text('processing_status').default('pending').notNull(), // 'pending', 'processing', 'completed', 'failed'
  aiSummary: text('ai_summary'),
  aiAnalysis: json('ai_analysis').default('{}').notNull(),
  embedding: json('embedding'),
  tags: json('tags').default('[]').notNull(),
  metadata: json('metadata').default('{}').notNull(),
  enhancedVersions: json('enhanced_versions').default('[]').notNull(),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date()),
});

// === EVIDENCE ANCHOR POINTS (Interactive markers for evidence) ===
export const evidenceAnchorPoints = table('evidence_anchor_points', {
  id: text('id').primaryKey(),
  evidenceFileId: text('evidence_file_id').notNull().references(() => evidenceFiles.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  anchorType: text('anchor_type').notNull(), // 'object', 'text', 'audio_segment', 'timeline_event', 'custom'
  positionX: real('position_x').notNull(), // Normalized 0-1 coordinates
  positionY: real('position_y').notNull(),
  timestamp: real('timestamp'), // For video/audio anchors - time in seconds
  duration: real('duration'), // For time-based anchors - duration in seconds
  label: text('label').notNull(),
  description: text('description'),
  confidence: real('confidence').default(0.0).notNull(),
  detectedObject: text('detected_object'), // YOLO/CV detection class
  detectedText: text('detected_text'), // OCR extracted text
  boundingBox: text('bounding_box'), // "x1,y1,x2,y2" for object detection
  legalRelevance: text('legal_relevance'), // 'high', 'medium', 'low', 'unknown'
  userNotes: text('user_notes'),
  aiAnalysis: json('ai_analysis').default('{}').notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  verifiedBy: text('verified_by').references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  verifiedAt: timestamp('verified_at'),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date()),
});

// === CASE EVIDENCE SUMMARIES (Scene Analysis) ===
export const caseEvidenceSummaries = table('case_evidence_summaries', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().references(() => cases.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  evidenceFileId: text('evidence_file_id').references(() => evidenceFiles.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  summaryType: text('summary_type').notNull(), // 'scene_analysis', 'timeline_reconstruction', 'contradiction_analysis'
  title: text('title').notNull(),
  markdownContent: text('markdown_content').notNull(),
  plainTextContent: text('plain_text_content').notNull(),
  keyFindings: json('key_findings').default('[]').notNull(),
  legalImplications: json('legal_implications').default('[]').notNull(),
  contradictions: json('contradictions').default('[]').notNull(),
  timelineEvents: json('timeline_events').default('[]').notNull(),
  emotionalAnalysis: json('emotional_analysis').default('{}').notNull(),
  embedding: json('embedding'),
  confidence: real('confidence').default(0.0).notNull(),
  reviewStatus: text('review_status').default('pending').notNull(), // 'pending', 'reviewed', 'approved', 'disputed'
  reviewedBy: text('reviewed_by').references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'),
  generatedBy: text('generated_by').default('ai').notNull(), // 'ai', 'user', 'hybrid'
  modelVersion: text('model_version'), // Track which AI model version generated this
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date()),
});

// === EVIDENCE RELATIONSHIPS (Cross-evidence connections) ===
export const evidenceRelationships = table('evidence_relationships', {
  id: text('id').primaryKey(),
  parentEvidenceId: text('parent_evidence_id').notNull().references(() => evidenceFiles.id, { onDelete: 'cascade' }),
  relatedEvidenceId: text('related_evidence_id').notNull().references(() => evidenceFiles.id, { onDelete: 'cascade' }),
  relationshipType: text('relationship_type').notNull(), // 'sequence', 'contradiction', 'corroboration', 'same_scene', 'same_person'
  confidence: real('confidence').default(0.0).notNull(),
  description: text('description'),
  aiAnalysis: json('ai_analysis').default('{}').notNull(),
  timelinePosition: real('timeline_position'), // Position in case timeline
  legalSignificance: text('legal_significance').default('unknown').notNull(), // 'critical', 'important', 'supportive', 'irrelevant'
  discoveredBy: text('discovered_by').notNull(), // 'ai', 'user', 'auto'
  verifiedBy: text('verified_by').references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date()),
});

// === MULTIMODAL SEARCH CACHE (Qdrant integration cache) ===
export const multimodalSearchCache = table('multimodal_search_cache', {
  id: text('id').primaryKey(),
  queryHash: text('query_hash').notNull().unique(),
  queryText: text('query_text').notNull(),
  queryType: text('query_type').notNull(), // 'semantic', 'visual', 'audio', 'timeline', 'cross_modal'
  caseId: text('case_id').references(() => cases.id, { onDelete: 'cascade' }),
  results: json('results').notNull(),
  resultCount: integer('result_count').notNull(),
  searchFilters: json('search_filters').default('{}').notNull(),
  embedding: json('embedding'),
  executionTime: real('execution_time'), // milliseconds
  accuracy: real('accuracy'), // if known from user feedback
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
  expiresAt: timestamp('expires_at').notNull().$defaultFn(() => new Date(Date.now() + 24 * 60 * 60 * 1000)), // 24 hours
});

// === USER MODEL PREFERENCES (LLM model management) ===
export const userModelPreferences = table('user_model_preferences', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  modelType: text('model_type').notNull(), // 'text_generation', 'embeddings', 'vision', 'audio'
  modelPath: text('model_path').notNull(),
  modelName: text('model_name').notNull(),
  modelVersion: text('model_version'),
  isActive: boolean('is_active').default(false).notNull(),
  modelConfig: json('model_config').default('{}').notNull(),
  performanceMetrics: json('performance_metrics').default('{}').notNull(),
  usageCount: integer('usage_count').default(0).notNull(),
  lastUsed: timestamp('last_used'),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date()),
});
