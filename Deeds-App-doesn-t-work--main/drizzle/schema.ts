import { pgTable, foreignKey, uuid, varchar, text, timestamp, integer, numeric, jsonb, unique, boolean, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



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

export const criminals = pgTable("criminals", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "criminals_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
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
	priors: jsonb().default([]).notNull(),
	convictions: jsonb().default([]).notNull(),
	notes: text(),
	aiSummary: text("ai_summary"),
	aiTags: jsonb("ai_tags").default([]).notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "criminals_created_by_users_id_fk"
		}),
]);

export const evidence = pgTable("evidence", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "evidence_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	caseId: uuid("case_id"),
	criminalId: integer("criminal_id"),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	fileUrl: text("file_url"),
	fileType: varchar("file_type", { length: 100 }),
	fileSize: integer("file_size"),
	uploadedBy: uuid("uploaded_by"),
	uploadedAt: timestamp("uploaded_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
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
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "statutes_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
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
}, (table) => [
	unique("statutes_code_unique").on(table.code),
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
}, (table) => [
	unique("users_email_unique").on(table.email),
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
