import { pgTable, foreignKey, uuid, varchar, text, timestamp, integer, numeric, jsonb, unique, boolean, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	emailVerified: timestamp("email_verified", { mode: 'string' }),
	hashedPassword: text("hashed_password"),
	role: varchar({ length: 50 }).default('prosecutor').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	firstName: varchar("first_name", { length: 100 }),
	lastName: varchar("last_name", { length: 100 }),
	name: text(),
	title: varchar({ length: 100 }),
	department: varchar({ length: 200 }),
	phone: varchar({ length: 20 }),
	officeAddress: text("office_address"),
	avatar: text(),
	bio: text(),
	specializations: jsonb().default([]).notNull(),
	username: varchar({ length: 100 }),
	image: text(),
	avatarUrl: text("avatar_url"),
	provider: varchar({ length: 50 }).default('credentials'),
	profile: jsonb().default({}),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const cases = pgTable("cases", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	caseNumber: varchar("case_number", { length: 50 }),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	incidentDate: timestamp("incident_date", { mode: 'string' }),
	location: text(),
	priority: varchar({ length: 20 }).default('medium').notNull(),
	status: varchar({ length: 20 }).default('open').notNull(),
	category: varchar({ length: 50 }),
	dangerScore: integer("danger_score").default(0).notNull(),
	estimatedValue: numeric("estimated_value", { precision: 12, scale:  2 }),
	jurisdiction: varchar({ length: 100 }),
	leadProsecutor: uuid("lead_prosecutor"),
	assignedTeam: jsonb("assigned_team").default([]).notNull(),
	aiSummary: text("ai_summary"),
	aiTags: jsonb("ai_tags").default([]).notNull(),
	metadata: jsonb().default({}).notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	closedAt: timestamp("closed_at", { mode: 'string' }),
	name: varchar({ length: 255 }),
	summary: text(),
	dateOpened: timestamp("date_opened", { mode: 'string' }),
	verdict: varchar({ length: 100 }),
	courtDates: text("court_dates"),
	linkedCriminals: text("linked_criminals"),
	linkedCrimes: text("linked_crimes"),
	notes: text(),
	tags: jsonb().default([]).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.leadProsecutor],
			foreignColumns: [users.id],
			name: "cases_lead_prosecutor_users_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "cases_created_by_users_id_fk"
		}),
]);

export const evidence = pgTable("evidence", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	caseId: uuid("case_id"),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	fileUrl: text("file_url"),
	fileType: varchar("file_type", { length: 100 }),
	fileSize: integer("file_size"),
	tags: jsonb().default([]).notNull(),
	uploadedBy: uuid("uploaded_by"),
	uploadedAt: timestamp("uploaded_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	fileName: varchar("file_name", { length: 255 }),
	summary: text(),
	aiSummary: text("ai_summary"),
}, (table) => [
	foreignKey({
			columns: [table.caseId],
			foreignColumns: [cases.id],
			name: "evidence_case_id_cases_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [users.id],
			name: "evidence_uploaded_by_users_id_fk"
		}),
]);

export const sessions = pgTable("sessions", {
	id: text().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const caseLawLinks = pgTable("case_law_links", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	caseId: uuid("case_id").notNull(),
	statuteId: uuid("statute_id"),
	lawParagraphId: uuid("law_paragraph_id"),
	linkType: varchar("link_type", { length: 50 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.caseId],
			foreignColumns: [cases.id],
			name: "case_law_links_case_id_cases_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.statuteId],
			foreignColumns: [statutes.id],
			name: "case_law_links_statute_id_statutes_id_fk"
		}),
	foreignKey({
			columns: [table.lawParagraphId],
			foreignColumns: [lawParagraphs.id],
			name: "case_law_links_law_paragraph_id_law_paragraphs_id_fk"
		}),
]);

export const lawParagraphs = pgTable("law_paragraphs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	statuteId: uuid("statute_id").notNull(),
	paragraphNumber: varchar("paragraph_number", { length: 50 }).notNull(),
	content: text().notNull(),
	aiSummary: text("ai_summary"),
	tags: jsonb().default([]).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	paragraphText: text("paragraph_text"),
	anchorId: varchar("anchor_id", { length: 100 }),
	linkedCaseIds: jsonb("linked_case_ids").default([]).notNull(),
	crimeSuggestions: jsonb("crime_suggestions").default([]).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.statuteId],
			foreignColumns: [statutes.id],
			name: "law_paragraphs_statute_id_statutes_id_fk"
		}).onDelete("cascade"),
]);

export const crimes = pgTable("crimes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	caseId: uuid("case_id"),
	criminalId: uuid("criminal_id"),
	statuteId: uuid("statute_id"),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	chargeLevel: varchar("charge_level", { length: 50 }),
	status: varchar({ length: 50 }).default('pending').notNull(),
	incidentDate: timestamp("incident_date", { mode: 'string' }),
	arrestDate: timestamp("arrest_date", { mode: 'string' }),
	filingDate: timestamp("filing_date", { mode: 'string' }),
	notes: text(),
	aiSummary: text("ai_summary"),
	metadata: jsonb().default({}).notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.caseId],
			foreignColumns: [cases.id],
			name: "crimes_case_id_cases_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.criminalId],
			foreignColumns: [criminals.id],
			name: "crimes_criminal_id_criminals_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.statuteId],
			foreignColumns: [statutes.id],
			name: "crimes_statute_id_statutes_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "crimes_created_by_users_id_fk"
		}),
]);

export const contentEmbeddings = pgTable("content_embeddings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	entityType: varchar("entity_type", { length: 50 }).notNull(),
	entityId: uuid("entity_id").notNull(),
	contentType: varchar("content_type", { length: 50 }).notNull(),
	embedding: jsonb().notNull(),
	text: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const criminals = pgTable("criminals", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	middleName: varchar("middle_name", { length: 100 }),
	aliases: jsonb().default([]).notNull(),
	dateOfBirth: timestamp("date_of_birth", { mode: 'string' }),
	address: text(),
	phone: varchar({ length: 20 }),
	email: varchar({ length: 255 }),
	height: integer(),
	weight: integer(),
	eyeColor: varchar("eye_color", { length: 20 }),
	hairColor: varchar("hair_color", { length: 20 }),
	distinguishingMarks: text("distinguishing_marks"),
	photoUrl: text("photo_url"),
	threatLevel: varchar("threat_level", { length: 20 }).default('low').notNull(),
	status: varchar({ length: 20 }).default('active').notNull(),
	priors: jsonb().default([]).notNull(),
	convictions: jsonb().default([]).notNull(),
	notes: text(),
	aiSummary: text("ai_summary"),
	aiTags: jsonb("ai_tags").default([]).notNull(),
	aiAnalysis: jsonb("ai_analysis").default({}).notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	name: varchar({ length: 255 }),
	convictionStatus: varchar("conviction_status", { length: 50 }),
	sentenceLength: varchar("sentence_length", { length: 100 }),
	convictionDate: timestamp("conviction_date", { mode: 'string' }),
	escapeAttempts: integer("escape_attempts").default(0),
	gangAffiliations: text("gang_affiliations"),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "criminals_created_by_users_id_fk"
		}),
]);

export const evidence = pgTable("evidence", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	caseId: uuid("case_id"),
	criminalId: uuid("criminal_id"),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	fileUrl: text("file_url"),
	fileType: varchar("file_type", { length: 100 }),
	fileSize: integer("file_size"),
	tags: jsonb().default([]).notNull(),
	uploadedBy: uuid("uploaded_by"),
	uploadedAt: timestamp("uploaded_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	fileName: varchar("file_name", { length: 255 }),
	summary: text(),
	aiSummary: text("ai_summary"),
}, (table) => [
	foreignKey({
			columns: [table.caseId],
			foreignColumns: [cases.id],
			name: "evidence_case_id_cases_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.criminalId],
			foreignColumns: [criminals.id],
			name: "evidence_criminal_id_criminals_id_fk"
		}),
	foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [users.id],
			name: "evidence_uploaded_by_users_id_fk"
		}),
]);

export const sessions = pgTable("sessions", {
	id: text().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const statutes = pgTable("statutes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	code: varchar({ length: 50 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	fullText: text("full_text"),
	category: varchar({ length: 100 }),
	severity: varchar({ length: 20 }),
	minPenalty: varchar("min_penalty", { length: 255 }),
	maxPenalty: varchar("max_penalty", { length: 255 }),
	jurisdiction: varchar({ length: 100 }),
	effectiveDate: timestamp("effective_date", { mode: 'string' }),
	aiSummary: text("ai_summary"),
	tags: jsonb().default([]).notNull(),
	relatedStatutes: jsonb("related_statutes").default([]).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	name: varchar({ length: 255 }),
	sectionNumber: varchar("section_number", { length: 50 }),
}, (table) => [
	unique("statutes_code_unique").on(table.code),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	emailVerified: timestamp("email_verified", { mode: 'string' }),
	hashedPassword: text("hashed_password"),
	role: varchar({ length: 50 }).default('prosecutor').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	firstName: varchar("first_name", { length: 100 }),
	lastName: varchar("last_name", { length: 100 }),
	name: text(),
	title: varchar({ length: 100 }),
	department: varchar({ length: 200 }),
	phone: varchar({ length: 20 }),
	officeAddress: text("office_address"),
	avatar: text(),
	bio: text(),
	specializations: jsonb().default([]).notNull(),
	username: varchar({ length: 100 }),
	image: text(),
	avatarUrl: text("avatar_url"),
	provider: varchar({ length: 50 }).default('credentials'),
	profile: jsonb().default({}),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const caseActivities = pgTable("case_activities", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	caseId: uuid("case_id").notNull(),
	activityType: varchar("activity_type", { length: 50 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	scheduledFor: timestamp("scheduled_for", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	status: varchar({ length: 20 }).default('pending').notNull(),
	priority: varchar({ length: 20 }).default('medium').notNull(),
	assignedTo: uuid("assigned_to"),
	relatedEvidence: jsonb("related_evidence").default([]).notNull(),
	relatedCriminals: jsonb("related_criminals").default([]).notNull(),
	metadata: jsonb().default({}).notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.caseId],
			foreignColumns: [cases.id],
			name: "case_activities_case_id_cases_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.assignedTo],
			foreignColumns: [users.id],
			name: "case_activities_assigned_to_users_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "case_activities_created_by_users_id_fk"
		}),
]);

export const verificationToken = pgTable("verificationToken", {
	identifier: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.identifier, table.token], name: "verificationToken_identifier_token_pk"}),
]);

export const account = pgTable("account", {
	userId: uuid().notNull(),
	type: text().notNull(),
	provider: text().notNull(),
	providerAccountId: text().notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: text("token_type"),
	scope: text(),
	idToken: text("id_token"),
	sessionState: text("session_state"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "account_userId_users_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.provider, table.providerAccountId], name: "account_provider_providerAccountId_pk"}),
]);
// });

// // === STATUTES ===
// export const statutes = sqliteTable('statutes', {
//   id: text('id').primaryKey(),
//   title: text('title').notNull(),
//   description: text('description'),
//   sectionNumber: text('section_number'),
//   content: text('content'),
//   meta: text('meta', { mode: 'json' }).default('{}').notNull(),
//   aiSummary: text('ai_summary'),
//   tags: text('tags', { mode: 'json' }).default('[]').notNull(),
//   createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
//   updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
// });

// // === CONTENT EMBEDDINGS ===
// export const contentEmbeddings = sqliteTable('content_embeddings', {
//   id: text('id').primaryKey(),
//   entityId: text('entity_id').notNull(),
//   entityType: text('entity_type').notNull(),
//   contentType: text('content_type').notNull(),
//   embedding: text('embedding', { mode: 'json' }).notNull(),
//   text: text('text').notNull(),
//   createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
// });

// // === CRIMINALS ===
// export const criminals = sqliteTable('criminals', {
//   id: text('id').primaryKey(),
//   firstName: text('first_name').notNull(),
//   lastName: text('last_name').notNull(),
//   middleName: text('middle_name'),
//   aliases: text('aliases', { mode: 'json' }).default('[]').notNull(),
//   dateOfBirth: integer('date_of_birth', { mode: 'timestamp' }),
//   address: text('address'),
//   phone: text('phone'),
//   photoUrl: text('photo_url'),
//   threatLevel: text('threat_level').default('low').notNull(),
//   status: text('status').default('active').notNull(),
//   priors: text('priors', { mode: 'json' }).default('[]').notNull(),
//   convictions: text('convictions', { mode: 'json' }).default('[]').notNull(),
//   notes: text('notes'),
//   aiSummary: text('ai_summary'),
//   aiTags: text('ai_tags', { mode: 'json' }).default('[]').notNull(),
//   aiAnalysis: text('ai_analysis', { mode: 'json' }).default('{}').notNull(),
//   createdBy: text('created_by').references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
//   createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
//   updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
// });

// // === CRIMES ===
// export const crimes = sqliteTable('crimes', {
//   id: text('id').primaryKey(),
//   caseId: text('case_id').references(() => cases.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
//   criminalId: text('criminal_id').references(() => criminals.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
//   statuteId: text('statute_id').references(() => statutes.id, { onDelete: 'set null', onUpdate: 'cascade' }),
//   name: text('name').notNull(),
//   description: text('description'),
//   chargeLevel: text('charge_level'),
//   status: text('status').default('pending').notNull(),
//   incidentDate: integer('incident_date', { mode: 'timestamp' }),
//   arrestDate: integer('arrest_date', { mode: 'timestamp' }),
//   filingDate: integer('filing_date', { mode: 'timestamp' }),
//   notes: text('notes'),
//   aiSummary: text('ai_summary'),
//   metadata: text('metadata', { mode: 'json' }).default('{}').notNull(),
//   createdBy: text('created_by').references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
//   createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
//   updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
// });

// // === LAW PARAGRAPHS ===
// export const lawParagraphs = sqliteTable('law_paragraphs', {
//   id: text('id').primaryKey(),
//   statuteId: text('statute_id').notNull().references(() => statutes.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
//   paragraphNumber: text('paragraph_number').notNull(),
//   content: text('content').notNull(),
//   aiSummary: text('ai_summary'),
//   tags: text('tags', { mode: 'json' }).default('[]').notNull(),
//   linkedCaseIds: text('linked_case_ids', { mode: 'json' }).default('[]').notNull(),
//   crimeSuggestions: text('crime_suggestions', { mode: 'json' }).default('[]').notNull(),
//   createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
//   updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
//   paragraphText: text('paragraph_text'),
//   anchorId: text('anchor_id'),
// });

// // === CASE ACTIVITIES ===
// export const caseActivities = sqliteTable('case_activities', {
//   id: text('id').primaryKey(),
//   caseId: text('case_id').notNull().references(() => cases.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
//   activityType: text('activity_type').notNull(),
//   title: text('title').notNull(),
//   description: text('description'),
//   scheduledFor: integer('scheduled_for', { mode: 'timestamp' }),
//   completedAt: integer('completed_at', { mode: 'timestamp' }),
//   status: text('status').default('pending').notNull(),
//   priority: text('priority').default('medium').notNull(),
//   assignedTo: text('assigned_to').references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
//   relatedEvidence: text('related_evidence', { mode: 'json' }).default('[]').notNull(),
//   relatedCriminals: text('related_criminals', { mode: 'json' }).default('[]').notNull(),
//   metadata: text('metadata', { mode: 'json' }).default('{}').notNull(),
//   createdBy: text('created_by').references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
//   createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
//   updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
// });

// // === CASE LAW LINKS ===
// export const caseLawLinks = sqliteTable('case_law_links', {
//   id: text('id').primaryKey(),
//   caseId: text('case_id').notNull().references(() => cases.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
//   statuteId: text('statute_id').references(() => statutes.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
//   lawParagraphId: text('law_paragraph_id').references(() => lawParagraphs.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
//   linkType: text('link_type').notNull(),
//   description: text('description'),
//   createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
//   updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
// });

// // === SESSIONS ===
// export const sessions = sqliteTable('sessions', {
//   id: text('id').primaryKey(),
//   userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
//   expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
//   createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
// });

// // === CASE EVENTS (Event Store Pattern) ===
// export const caseEvents = sqliteTable('case_events', {
//   id: text('id').primaryKey(),
//   caseId: text('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
//   eventType: text('event_type').notNull(), // 'created', 'evidence_added', 'status_changed', 'merged', 'text_moved'
//   eventData: text('event_data', { mode: 'json' }).notNull(),
//   previousState: text('previous_state'),
//   newState: text('new_state'),
//   userId: text('user_id').references(() => users.id),
//   sessionId: text('session_id'),
//   metadata: text('metadata', { mode: 'json' }).default('{}').notNull(),
//   timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
// });

// // === CASE RELATIONSHIPS ===
// export const caseRelationships = sqliteTable('case_relationships', {
//   id: text('id').primaryKey(),
//   parentCaseId: text('parent_case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
//   relatedCaseId: text('related_case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
//   relationshipType: text('relationship_type').notNull(), // 'similar', 'merged_from', 'merged_into', 'related', 'duplicate'
//   confidence: real('confidence').default(0.0).notNull(), // NLP confidence score 0.0-1.0
//   aiAnalysis: text('ai_analysis', { mode: 'json' }).default('{}').notNull(),
//   description: text('description'),
//   discoveredBy: text('discovered_by').notNull(), // 'user', 'nlp', 'auto'
//   createdBy: text('created_by').references(() => users.id),
//   createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
//   updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
// });

// // === CASE RELATIONSHIP FEEDBACK (User feedback for ML/NLP improvement) ===
// export const caseRelationshipFeedback = sqliteTable('case_relationship_feedback', {
//   id: text('id').primaryKey(),
//   parentCaseId: text('parent_case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
//   relatedCaseId: text('related_case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
//   userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
//   feedback: text('feedback').notNull(), // 'positive', 'negative', 'neutral'
//   confidence: real('confidence').default(0.0).notNull(), // Original AI confidence score
//   userScore: integer('user_score').notNull(), // -1, 0, 1 for negative, neutral, positive
//   feedbackType: text('feedback_type').notNull(), // 'manual', 'implicit', 'explicit'
//   context: text('context', { mode: 'json' }).default('{}').notNull(), // Additional context data
//   sessionId: text('session_id'), // For tracking feedback sessions
//   createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
//   updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
// });

// // === SAVED STATEMENTS (Auto-completion templates) ===
// export const savedStatements = sqliteTable('saved_statements', {
//   id: text('id').primaryKey(),
//   title: text('title').notNull(),
//   content: text('content').notNull(),
//   category: text('category').notNull(), // 'opening', 'closing', 'evidence_description', 'legal_argument'
//   tags: text('tags', { mode: 'json' }).default('[]').notNull(),
//   usageCount: integer('usage_count').default(0).notNull(),
//   caseTypes: text('case_types', { mode: 'json' }).default('[]').notNull(), // which case types this applies to
//   isPublic: integer('is_public', { mode: 'boolean' }).default(false).notNull(),
//   createdBy: text('created_by').references(() => users.id),
//   lastUsed: integer('last_used', { mode: 'timestamp' }),
//   createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
//   updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
// });

// // === CASE TEXT FRAGMENTS (For text moving between cases) ===
// export const caseTextFragments = sqliteTable('case_text_fragments', {
//   id: text('id').primaryKey(),
//   caseId: text('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
//   fragmentType: text('fragment_type').notNull(), // 'description', 'evidence_note', 'legal_argument', 'custom'
//   content: text('content').notNull(),
//   position: integer('position').default(0).notNull(), // for ordering within case
//   isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
//   source: text('source'), // original case ID if moved from another case
//   tags: text('tags', { mode: 'json' }).default('[]').notNull(),
//   embedding: text('embedding', { mode: 'json' }), // for semantic search
//   createdBy: text('created_by').references(() => users.id),
//   createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
//   updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
// });

// // === NLP ANALYSIS CACHE ===
// export const nlpAnalysisCache = sqliteTable('nlp_analysis_cache', {
//   id: text('id').primaryKey(),
//   contentHash: text('content_hash').notNull().unique(), // hash of analyzed content
//   contentType: text('content_type').notNull(), // 'case_description', 'evidence', 'statement'
//   originalText: text('original_text').notNull(),
//   analysis: text('analysis', { mode: 'json' }).notNull(),
//   entities: text('entities', { mode: 'json' }).default('[]').notNull(),
//   sentiment: real('sentiment'),
//   confidence: real('confidence'),
//   suggestions: text('suggestions', { mode: 'json' }).default('[]').notNull(),
//   relatedCases: text('related_cases', { mode: 'json' }).default('[]').notNull(),
//   relatedStatutes: text('related_statutes', { mode: 'json' }).default('[]').notNull(),
//   embedding: text('embedding', { mode: 'json' }),
//   createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
//   expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days
// });

// // === USER PREFERENCES (for auto-completion and recommendations) ===
// export const userPreferences = sqliteTable('user_preferences', {
//   id: text('id').primaryKey(),
//   userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
//   preferenceType: text('preference_type').notNull(), // 'auto_complete', 'case_templates', 'nlp_settings'
//   preferences: text('preferences', { mode: 'json' }).notNull(),
//   createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
//   updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
// });

// // === CASE TEMPLATES (for auto-completion) ===
// export const caseTemplates = sqliteTable('case_templates', {
//   id: text('id').primaryKey(),
//   name: text('name').notNull(),
//   description: text('description'),
//   caseType: text('case_type').notNull(),
//   template: text('template', { mode: 'json' }).notNull(), // template structure with fields
//   fields: text('fields', { mode: 'json' }).default('[]').notNull(), // field definitions
//   usageCount: integer('usage_count').default(0).notNull(),
//   isPublic: integer('is_public', { mode: 'boolean' }).default(false).notNull(),
//   createdBy: text('created_by').references(() => users.id),
//   createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
//   updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
// });

// // === MULTIMODAL EVIDENCE FILES ===
// export const evidenceFiles = sqliteTable('evidence_files', {
//   id: text('id').primaryKey(),
//   caseId: text('case_id').notNull().references(() => cases.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
//   fileName: text('file_name').notNull(),
//   filePath: text('file_path').notNull(),
//   fileType: text('file_type').notNull(), // 'image', 'video', 'audio', 'document'
//   fileSize: integer('file_size').notNull(),
//   mimeType: text('mime_type'),
//   duration: real('duration'), // for video/audio files in seconds
//   dimensions: text('dimensions'), // "width,height" for images/videos
//   checksum: text('checksum'), // for file integrity verification
//   uploadedBy: text('uploaded_by').references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
//   processedAt: integer('processed_at', { mode: 'timestamp' }),
//   processingStatus: text('processing_status').default('pending').notNull(), // 'pending', 'processing', 'completed', 'failed'
//   aiSummary: text('ai_summary'),
//   aiAnalysis: text('ai_analysis', { mode: 'json' }).default('{}').notNull(),
//   embedding: text('embedding', { mode: 'json' }),
//   tags: text('tags', { mode: 'json' }).default('[]').notNull(),
//   metadata: text('metadata', { mode: 'json' }).default('{}').notNull(),
//   enhancedVersions: text('enhanced_versions', { mode: 'json' }).default('[]').notNull(),
//   createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
//   updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
// });

// // === EVIDENCE ANCHOR POINTS (Interactive markers for evidence) ===
// export const evidenceAnchorPoints = sqliteTable('evidence_anchor_points', {
//   id: text('id').primaryKey(),
//   evidenceFileId: text('evidence_file_id').notNull().references(() => evidenceFiles.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
//   anchorType: text('anchor_type').notNull(), // 'object', 'text', 'audio_segment', 'timeline_event', 'custom'
//   positionX: real('position_x').notNull(), // Normalized 0-1 coordinates
//   positionY: real('position_y').notNull(),
//   timestamp: real('timestamp'), // For video/audio anchors - time in seconds
//   duration: real('duration'), // For time-based anchors - duration in seconds
//   label: text('label').notNull(),
//   description: text('description'),
//   confidence: real('confidence').default(0.0).notNull(),
//   detectedObject: text('detected_object'), // YOLO/CV detection class
//   detectedText: text('detected_text'), // OCR extracted text
//   boundingBox: text('bounding_box'), // "x1,y1,x2,y2" for object detection
//   legalRelevance: text('legal_relevance'), // 'high', 'medium', 'low', 'unknown'
//   userNotes: text('user_notes'),
//   aiAnalysis: text('ai_analysis', { mode: 'json' }).default('{}').notNull(),
//   isVerified: integer('is_verified', { mode: 'boolean' }).default(false).notNull(),
//   verifiedBy: text('verified_by').references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
//   verifiedAt: integer('verified_at', { mode: 'timestamp' }),
//   createdBy: text('created_by').references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
//   createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
//   updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
// });

// // === CASE EVIDENCE SUMMARIES (Scene Analysis) ===
// export const caseEvidenceSummaries = sqliteTable('case_evidence_summaries', {
//   id: text('id').primaryKey(),
//   caseId: text('case_id').notNull().references(() => cases.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
//   evidenceFileId: text('evidence_file_id').references(() => evidenceFiles.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
//   summaryType: text('summary_type').notNull(), // 'scene_analysis', 'timeline_reconstruction', 'contradiction_analysis'
//   title: text('title').notNull(),
//   markdownContent: text('markdown_content').notNull(),
//   plainTextContent: text('plain_text_content').notNull(),
//   keyFindings: text('key_findings', { mode: 'json' }).default('[]').notNull(),
//   legalImplications: text('legal_implications', { mode: 'json' }).default('[]').notNull(),
//   contradictions: text('contradictions', { mode: 'json' }).default('[]').notNull(),
//   timelineEvents: text('timeline_events', { mode: 'json' }).default('[]').notNull(),
//   emotionalAnalysis: text('emotional_analysis', { mode: 'json' }).default('{}').notNull(),
//   embedding: text('embedding', { mode: 'json' }),
//   confidence: real('confidence').default(0.0).notNull(),
//   reviewStatus: text('review_status').default('pending').notNull(), // 'pending', 'reviewed', 'approved', 'disputed'
//   reviewedBy: text('reviewed_by').references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
//   reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
//   reviewNotes: text('review_notes'),
//   generatedBy: text('generated_by').default('ai').notNull(), // 'ai', 'user', 'hybrid'
//   modelVersion: text('model_version'), // Track which AI model version generated this
//   createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
//   updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
// });

// // === EVIDENCE RELATIONSHIPS (Cross-evidence connections) ===
// export const evidenceRelationships = sqliteTable('evidence_relationships', {
//   id: text('id').primaryKey(),
//   parentEvidenceId: text('parent_evidence_id').notNull().references(() => evidenceFiles.id, { onDelete: 'cascade' }),
//   relatedEvidenceId: text('related_evidence_id').notNull().references(() => evidenceFiles.id, { onDelete: 'cascade' }),
//   relationshipType: text('relationship_type').notNull(), // 'sequence', 'contradiction', 'corroboration', 'same_scene', 'same_person'
//   confidence: real('confidence').default(0.0).notNull(),
//   description: text('description'),
//   aiAnalysis: text('ai_analysis', { mode: 'json' }).default('{}').notNull(),
//   timelinePosition: real('timeline_position'), // Position in case timeline
//   legalSignificance: text('legal_significance').default('unknown').notNull(), // 'critical', 'important', 'supportive', 'irrelevant'
//   discoveredBy: text('discovered_by').notNull(), // 'ai', 'user', 'auto'
//   verifiedBy: text('verified_by').references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
//   verifiedAt: integer('verified_at', { mode: 'timestamp' }),
//   createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
//   updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
// });

// // === MULTIMODAL SEARCH CACHE (Qdrant integration cache) ===
// export const multimodalSearchCache = sqliteTable('multimodal_search_cache', {
//   id: text('id').primaryKey(),
//   queryHash: text('query_hash').notNull().unique(),
//   queryText: text('query_text').notNull(),
//   queryType: text('query_type').notNull(), // 'semantic', 'visual', 'audio', 'timeline', 'cross_modal'
//   caseId: text('case_id').references(() => cases.id, { onDelete: 'cascade' }),
//   results: text('results', { mode: 'json' }).notNull(),
//   resultCount: integer('result_count').notNull(),
//   searchFilters: text('search_filters', { mode: 'json' }).default('{}').notNull(),
//   embedding: text('embedding', { mode: 'json' }),
//   executionTime: real('execution_time'), // milliseconds
//   accuracy: real('accuracy'), // if known from user feedback
//   userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
//   createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
//   expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date(Date.now() + 24 * 60 * 60 * 1000)), // 24 hours
// });

// // === USER MODEL PREFERENCES (LLM model management) ===
// export const userModelPreferences = sqliteTable('user_model_preferences', {
//   id: text('id').primaryKey(),
//   userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
//   modelType: text('model_type').notNull(), // 'text_generation', 'embeddings', 'vision', 'audio'
//   modelPath: text('model_path').notNull(),
//   modelName: text('model_name').notNull(),
//   modelVersion: text('model_version'),
//   isActive: integer('is_active', { mode: 'boolean' }).default(false).notNull(),
//   modelConfig: text('model_config', { mode: 'json' }).default('{}').notNull(),
//   performanceMetrics: text('performance_metrics', { mode: 'json' }).default('{}').notNull(),
//   usageCount: integer('usage_count').default(0).notNull(),
//   lastUsed: integer('last_used', { mode: 'timestamp' }),
//   createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
//   updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
// });
// All SQLite-specific code is now commented out. Use only schema-new.ts for all DB operations.

// TypeScript types
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;