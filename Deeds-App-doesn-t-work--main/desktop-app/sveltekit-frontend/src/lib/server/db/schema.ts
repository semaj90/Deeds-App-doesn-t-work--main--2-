import { pgTable, text, timestamp, integer, serial, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(), // Keep as password for now to match existing usage
  hashedPassword: text('hashed_password'), // Add for compatibility
  name: text('name'), // Add missing name field
  role: text('role').notNull().default('user'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  preferences: jsonb('preferences').default('{}'),
  profile: jsonb('profile').default('{}'),
  image: text('image'), // Add missing image field
  provider: text('provider'), // Add missing provider field
  emailVerified: boolean('email_verified').default(false),
  avatar: text('avatar')
});

// Sessions table
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Cases table
export const cases = pgTable('cases', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  name: text('name'), // Add alias for title
  description: text('description'),
  summary: text('summary'), // Add missing summary field
  caseNumber: text('case_number').notNull().unique(),
  status: text('status').notNull().default('active'),
  priority: text('priority').notNull().default('medium'),
  assignedTo: integer('assigned_to').references(() => users.id),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  dueDate: timestamp('due_date'),
  closedAt: timestamp('closed_at'),
  dateOpened: timestamp('date_opened'), // Add missing dateOpened field
  verdict: text('verdict'), // Add missing verdict field
  courtDates: text('court_dates'), // Add missing courtDates field
  linkedCriminals: text('linked_criminals'), // Add missing linkedCriminals field
  linkedCrimes: text('linked_crimes'), // Add missing linkedCrimes field
  notes: text('notes'), // Add missing notes field
  dangerScore: integer('danger_score'), // Add missing dangerScore field
  aiSummary: text('ai_summary'), // Add missing aiSummary field
  metadata: jsonb('metadata').default('{}'),
  tags: jsonb('tags').default('[]')
});

// Criminals table
export const criminals = pgTable('criminals', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  dateOfBirth: timestamp('date_of_birth'),
  address: text('address'),
  phone: text('phone'), // Add missing phone field
  phoneNumber: text('phone_number'),
  email: text('email'),
  photoUrl: text('photo_url'),
  description: text('description'),
  status: text('status').notNull().default('active'),
  dangerLevel: integer('danger_level').default(1),
  threatLevel: integer('threat_level').default(1), // Add missing threatLevel field
  convictionStatus: text('conviction_status'), // Add missing convictionStatus field
  sentenceLength: text('sentence_length'), // Add missing sentenceLength field
  convictionDate: timestamp('conviction_date'), // Add missing convictionDate field
  escapeAttempts: integer('escape_attempts').default(0), // Add missing escapeAttempts field
  gangAffiliations: text('gang_affiliations'), // Add missing gangAffiliations field
  notes: text('notes'), // Add missing notes field
  aliases: jsonb('aliases').default('[]'), // Add missing aliases field
  priors: jsonb('priors').default('[]'), // Add missing priors field
  convictions: jsonb('convictions').default('[]'), // Add missing convictions field
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  metadata: jsonb('metadata').default('{}')
});

// Crimes table
export const crimes = pgTable('crimes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  name: text('name'), // Add missing name field
  description: text('description'),
  type: text('type').notNull(),
  severity: text('severity').notNull().default('misdemeanor'),
  statuteId: integer('statute_id').references(() => statutes.id),
  criminalId: integer('criminal_id').references(() => criminals.id),
  caseId: integer('case_id').references(() => cases.id),
  dateCommitted: timestamp('date_committed'),
  location: text('location'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  metadata: jsonb('metadata').default('{}')
});

// Statutes table
export const statutes = pgTable('statutes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  name: text('name'), // Add missing name field
  description: text('description'),
  code: text('code').notNull().unique(),
  sectionNumber: text('section_number'), // Add missing sectionNumber field
  category: text('category').notNull(),
  severity: text('severity').notNull().default('misdemeanor'),
  penaltyMin: text('penalty_min'),
  penaltyMax: text('penalty_max'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  metadata: jsonb('metadata').default('{}'),
  tags: jsonb('tags').default('[]'), // Add tags field
  aiSummary: text('ai_summary') // Add aiSummary field
});

// Law Paragraphs table
export const lawParagraphs = pgTable('law_paragraphs', {
  id: serial('id').primaryKey(),
  statuteId: integer('statute_id').notNull().references(() => statutes.id),
  content: text('content').notNull(),
  paragraphText: text('paragraph_text'), // Add missing paragraphText field
  anchorId: text('anchor_id'), // Add missing anchorId field
  linkedCaseIds: jsonb('linked_case_ids').default('[]'), // Add missing linkedCaseIds field
  crimeSuggestions: jsonb('crime_suggestions').default('[]'), // Add missing crimeSuggestions field
  section: text('section'),
  subsection: text('subsection'),
  order: integer('order').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Case Law Links table
export const caseLawLinks = pgTable('case_law_links', {
  id: serial('id').primaryKey(),
  lawId: integer('law_id').notNull().references(() => lawParagraphs.id),
  caseId: integer('case_id').notNull().references(() => cases.id),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Evidence table
export const evidence = pgTable('evidence', {
  id: serial('id').primaryKey(),
  caseId: integer('case_id').references(() => cases.id),
  criminalId: integer('criminal_id').references(() => criminals.id),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type').notNull(),
  url: text('url').notNull(),
  fileName: text('file_name'),
  fileType: text('file_type'), // Add missing fileType field
  fileSize: integer('file_size'),
  fileUrl: text('file_url'), // Add missing fileUrl field
  uploadedBy: integer('uploaded_by').notNull().references(() => users.id),
  uploadedAt: timestamp('uploaded_at').defaultNow(), // Add missing uploadedAt field
  summary: text('summary'), // Add missing summary field
  tags: jsonb('tags').default('[]'), // Add missing tags field
  isVerified: boolean('is_verified').default(false),
  chain_of_custody: jsonb('chain_of_custody').default('[]'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  metadata: jsonb('metadata').default('{}')
});

// Content Embeddings table
export const contentEmbeddings = pgTable('content_embeddings', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  contentId: integer('content_id'), // Add missing contentId field
  contentType: text('content_type'), // Add missing contentType field
  embedding: text('embedding').notNull(),
  sourceType: text('source_type').notNull(),
  sourceId: integer('source_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  metadata: jsonb('metadata').default('{}')
});

// Deeds table
export const deeds = pgTable('deeds', {
  id: serial('id').primaryKey(),
  caseId: integer('case_id').notNull().references(() => cases.id),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type').notNull().default('general'),
  status: text('status').notNull().default('pending'),
  priority: text('priority').notNull().default('medium'),
  assignedTo: integer('assigned_to').references(() => users.id),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  dueDate: timestamp('due_date'),
  metadata: jsonb('metadata').default('{}'),
  attachments: jsonb('attachments').default('[]')
});

// Documents table
export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  caseId: integer('case_id').references(() => cases.id),
  deedId: integer('deed_id').references(() => deeds.id),
  name: text('name').notNull(),
  type: text('type').notNull(),
  url: text('url').notNull(),
  size: integer('size'),
  uploadedBy: integer('uploaded_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  metadata: jsonb('metadata').default('{}')
});

// Comments table
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  caseId: integer('case_id').references(() => cases.id),
  deedId: integer('deed_id').references(() => deeds.id),
  content: text('content').notNull(),
  authorId: integer('author_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  metadata: jsonb('metadata').default('{}')
});

// Activity Logs table
export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  resource: text('resource').notNull(),
  resourceId: integer('resource_id'),
  details: jsonb('details').default('{}'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Notifications table
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull().default('info'),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  metadata: jsonb('metadata').default('{}')
});

// Settings table
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: jsonb('value').notNull(),
  description: text('description'),
  category: text('category').notNull().default('general'),
  isPublic: boolean('is_public').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Citation Points table for AI-powered legal citations
export const citationPoints = pgTable('citation_points', {
  id: serial('id').primaryKey(),
  uuid: text('uuid').notNull().unique().default('gen_random_uuid()'), // For external references
  summary: text('summary').notNull(), // AI-generated snippet
  source: text('source').notNull(), // e.g., "evidence/123", "document/456"
  sourceId: integer('source_id'), // Reference to actual source record
  sourceType: text('source_type').notNull(),
  labels: jsonb('labels').default('[]'), // Array of string labels
  vector: jsonb('vector'), // Semantic search embedding vector
  confidence: integer('confidence'), // AI confidence score (0-100)
  linkedTo: integer('linked_to').references(() => cases.id), // Case this citation is linked to
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  isArchived: boolean('is_archived').default(false),
  metadata: jsonb('metadata').default('{}') // Additional AI/processing metadata
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  assignedCases: many(cases, { relationName: 'assignedCases' }),
  createdCases: many(cases, { relationName: 'createdCases' }),
  assignedDeeds: many(deeds, { relationName: 'assignedDeeds' }),
  createdDeeds: many(deeds, { relationName: 'createdDeeds' }),
  documents: many(documents),
  comments: many(comments),
  activityLogs: many(activityLogs),
  notifications: many(notifications),
  uploadedEvidence: many(evidence)
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id]
  })
}));

export const casesRelations = relations(cases, ({ one, many }) => ({
  assignedTo: one(users, {
    fields: [cases.assignedTo],
    references: [users.id],
    relationName: 'assignedCases'
  }),
  createdBy: one(users, {
    fields: [cases.createdBy],
    references: [users.id],
    relationName: 'createdCases'
  }),
  deeds: many(deeds),
  documents: many(documents),
  comments: many(comments),
  evidence: many(evidence),
  crimes: many(crimes),
  caseLawLinks: many(caseLawLinks)
}));

export const criminalsRelations = relations(criminals, ({ many }) => ({
  crimes: many(crimes),
  evidence: many(evidence)
}));

export const crimesRelations = relations(crimes, ({ one }) => ({
  statute: one(statutes, {
    fields: [crimes.statuteId],
    references: [statutes.id]
  }),
  criminal: one(criminals, {
    fields: [crimes.criminalId],
    references: [criminals.id]
  }),
  case: one(cases, {
    fields: [crimes.caseId],
    references: [cases.id]
  })
}));

export const statutesRelations = relations(statutes, ({ many }) => ({
  crimes: many(crimes),
  lawParagraphs: many(lawParagraphs)
}));

export const lawParagraphsRelations = relations(lawParagraphs, ({ one, many }) => ({
  statute: one(statutes, {
    fields: [lawParagraphs.statuteId],
    references: [statutes.id]
  }),
  caseLawLinks: many(caseLawLinks)
}));

export const caseLawLinksRelations = relations(caseLawLinks, ({ one }) => ({
  law: one(lawParagraphs, {
    fields: [caseLawLinks.lawId],
    references: [lawParagraphs.id]
  }),
  case: one(cases, {
    fields: [caseLawLinks.caseId],
    references: [cases.id]
  })
}));

export const evidenceRelations = relations(evidence, ({ one }) => ({
  case: one(cases, {
    fields: [evidence.caseId],
    references: [cases.id]
  }),
  criminal: one(criminals, {
    fields: [evidence.criminalId],
    references: [criminals.id]
  }),
  uploadedBy: one(users, {
    fields: [evidence.uploadedBy],
    references: [users.id]
  })
}));

export const deedsRelations = relations(deeds, ({ one, many }) => ({
  case: one(cases, {
    fields: [deeds.caseId],
    references: [cases.id]
  }),
  assignedTo: one(users, {
    fields: [deeds.assignedTo],
    references: [users.id],
    relationName: 'assignedDeeds'
  }),
  createdBy: one(users, {
    fields: [deeds.createdBy],
    references: [users.id],
    relationName: 'createdDeeds'
  }),
  documents: many(documents),
  comments: many(comments)
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  case: one(cases, {
    fields: [documents.caseId],
    references: [cases.id]
  }),
  deed: one(deeds, {
    fields: [documents.deedId],
    references: [deeds.id]
  }),
  uploadedBy: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id]
  })
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  case: one(cases, {
    fields: [comments.caseId],
    references: [cases.id]
  }),
  deed: one(deeds, {
    fields: [comments.deedId],
    references: [deeds.id]
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id]
  })
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id]
  })
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id]
  })
}));

export const citationPointsRelations = relations(citationPoints, ({ one }) => ({
  case: one(cases, {
    fields: [citationPoints.linkedTo],
    references: [cases.id]
  }),
  creator: one(users, {
    fields: [citationPoints.createdBy],
    references: [users.id]
  })
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Case = typeof cases.$inferSelect;
export type NewCase = typeof cases.$inferInsert;
export type Criminal = typeof criminals.$inferSelect;
export type NewCriminal = typeof criminals.$inferInsert;
export type Crime = typeof crimes.$inferSelect;
export type NewCrime = typeof crimes.$inferInsert;
export type Statute = typeof statutes.$inferSelect;
export type NewStatute = typeof statutes.$inferInsert;
export type LawParagraph = typeof lawParagraphs.$inferSelect;
export type NewLawParagraph = typeof lawParagraphs.$inferInsert;
export type CaseLawLink = typeof caseLawLinks.$inferSelect;
export type NewCaseLawLink = typeof caseLawLinks.$inferInsert;
export type Evidence = typeof evidence.$inferSelect;
export type NewEvidence = typeof evidence.$inferInsert;
export type ContentEmbedding = typeof contentEmbeddings.$inferSelect;
export type NewContentEmbedding = typeof contentEmbeddings.$inferInsert;
export type Deed = typeof deeds.$inferSelect;
export type NewDeed = typeof deeds.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
export type CitationPoint = typeof citationPoints.$inferSelect;
export type NewCitationPoint = typeof citationPoints.$inferInsert;
