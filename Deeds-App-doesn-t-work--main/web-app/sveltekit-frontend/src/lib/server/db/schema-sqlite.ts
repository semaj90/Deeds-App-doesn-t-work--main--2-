// --- All SQLite code below is commented out for PostgreSQL unification ---
// import { 
//   sqliteTable,
//   text, 
//   integer,
//   real
// } from 'drizzle-orm/sqlite-core';
// import { relations } from 'drizzle-orm';

// // === USERS & AUTHENTICATION ===
// export const users = sqliteTable('users', {
//   id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
//   email: text('email').notNull().unique(),
//   emailVerified: integer('email_verified', { mode: 'timestamp' }),
//   hashedPassword: text('hashed_password'),
//   role: text('role').default('prosecutor').notNull(),
//   isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
//   createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
//   updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  
//   // Profile fields
//   firstName: text('first_name'),
//   lastName: text('last_name'),
//   name: text('name'),
//   title: text('title'),
//   department: text('department'),
//   phone: text('phone'),
//   officeAddress: text('office_address'),
//   avatar: text('avatar'),
//   bio: text('bio'),
//   specializations: text('specializations', { mode: 'json' }).$defaultFn(() => []).notNull(),
// });

// export const sessions = sqliteTable('sessions', {
//   id: text('id').primaryKey(),
//   userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
//   expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
//   createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
// });

// // === CRIMINALS ===
// export const criminals = sqliteTable('criminals', {
//   id: integer('id').primaryKey({ autoIncrement: true }),
//   firstName: text('first_name').notNull(),
//   lastName: text('last_name').notNull(),
//   middleName: text('middle_name'),
//   aliases: text('aliases', { mode: 'json' }).$defaultFn(() => []).notNull(),
//   dateOfBirth: integer('date_of_birth', { mode: 'timestamp' }),
//   address: text('address'),
//   phone: text('phone'),
//   email: text('email'),
//   height: integer('height'),
//   weight: integer('weight'),
//   eyeColor: text('eye_color'),
//   hairColor: text('hair_color'),
//   distinguishingMarks: text('distinguishing_marks'),
//   photoUrl: text('photo_url'),
//   threatLevel: text('threat_level').default('low').notNull(),
//   priors: text('priors', { mode: 'json' }).$defaultFn(() => []).notNull(),
//   convictions: text('convictions', { mode: 'json' }).$defaultFn(() => []).notNull(),
//   notes: text('notes'),
//   aiSummary: text('ai_summary'),
//   aiTags: text('ai_tags', { mode: 'json' }).$defaultFn(() => []).notNull(),
//   createdBy: text('created_by').references(() => users.id),
//   createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
//   updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
// });

// // === CASES ===
// export const cases = sqliteTable('cases', {
//   id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
//   caseNumber: text('case_number'),
//   title: text('title').notNull(),
//   description: text('description'),
//   incidentDate: integer('incident_date', { mode: 'timestamp' }),
//   location: text('location'),
//   priority: text('priority').default('medium').notNull(),
//   status: text('status').default('open').notNull(),
//   category: text('category'),
//   dangerScore: integer('danger_score').default(0).notNull(),
//   estimatedValue: real('estimated_value'),
//   jurisdiction: text('jurisdiction'),
//   leadProsecutor: text('lead_prosecutor').references(() => users.id),
//   assignedTeam: text('assigned_team', { mode: 'json' }).$defaultFn(() => []).notNull(),
//   aiSummary: text('ai_summary'),
//   aiTags: text('ai_tags', { mode: 'json' }).$defaultFn(() => []).notNull(),
//   metadata: text('metadata', { mode: 'json' }).$defaultFn(() => ({})).notNull(),
//   createdBy: text('created_by').references(() => users.id),
//   createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
//   updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
//   closedAt: integer('closed_at', { mode: 'timestamp' }),
// });

// // === EVIDENCE ===
// export const evidence = sqliteTable('evidence', {
//   id: integer('id').primaryKey({ autoIncrement: true }),
//   caseId: text('case_id').references(() => cases.id, { onDelete: 'cascade' }),
//   criminalId: integer('criminal_id').references(() => criminals.id),
//   title: text('title').notNull(),
//   description: text('description'),
//   fileUrl: text('file_url'),
//   fileType: text('file_type'),
//   fileSize: integer('file_size'),
//   uploadedBy: text('uploaded_by').references(() => users.id),
//   uploadedAt: integer('uploaded_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
//   updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
// });

// // === STATUTES ===
// export const statutes = sqliteTable('statutes', {
//   id: integer('id').primaryKey({ autoIncrement: true }),
//   code: text('code').notNull().unique(),
//   title: text('title').notNull(),
//   description: text('description'),
//   fullText: text('full_text'),
//   category: text('category'),
//   severity: text('severity'),
//   minPenalty: text('min_penalty'),
//   maxPenalty: text('max_penalty'),
//   jurisdiction: text('jurisdiction'),
//   effectiveDate: integer('effective_date', { mode: 'timestamp' }),
//   aiSummary: text('ai_summary'),
//   tags: text('tags', { mode: 'json' }).$defaultFn(() => []).notNull(),
//   relatedStatutes: text('related_statutes', { mode: 'json' }).$defaultFn(() => []).notNull(),
//   createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
//   updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
// });

// // === CASE ACTIVITIES ===
// export const caseActivities = sqliteTable('case_activities', {
//   id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
//   caseId: text('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
//   activityType: text('activity_type').notNull(),
//   title: text('title').notNull(),
//   description: text('description'),
//   scheduledFor: integer('scheduled_for', { mode: 'timestamp' }),
//   completedAt: integer('completed_at', { mode: 'timestamp' }),
//   status: text('status').default('pending').notNull(),
//   priority: text('priority').default('medium').notNull(),
//   assignedTo: text('assigned_to').references(() => users.id),
//   relatedEvidence: text('related_evidence', { mode: 'json' }).$defaultFn(() => []).notNull(),
//   relatedCriminals: text('related_criminals', { mode: 'json' }).$defaultFn(() => []).notNull(),
//   metadata: text('metadata', { mode: 'json' }).$defaultFn(() => ({})).notNull(),
//   createdBy: text('created_by').references(() => users.id),
//   createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
//   updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
// });

// // === LEGACY COMPATIBILITY ===
// export const userTable = users;
// export const sessionTable = sessions;

// // === RELATIONS ===
// export const usersRelations = relations(users, ({ many }) => ({
//   sessions: many(sessions),
//   cases: many(cases),
//   evidence: many(evidence),
//   createdCriminals: many(criminals),
//   assignedActivities: many(caseActivities),
// }));

// export const sessionsRelations = relations(sessions, ({ one }) => ({
//   user: one(users, {
//     fields: [sessions.userId],
//     references: [users.id],
//   }),
// }));

// export const casesRelations = relations(cases, ({ one, many }) => ({
//   createdBy: one(users, {
//     fields: [cases.createdBy],
//     references: [users.id],
//   }),
//   leadProsecutor: one(users, {
//     fields: [cases.leadProsecutor],
//     references: [users.id],
//   }),
//   evidence: many(evidence),
//   activities: many(caseActivities),
// }));

// export const criminalsRelations = relations(criminals, ({ one, many }) => ({
//   createdBy: one(users, {
//     fields: [criminals.createdBy],
//     references: [users.id],
//   }),
//   evidence: many(evidence),
// }));

// export const evidenceRelations = relations(evidence, ({ one }) => ({
//   case: one(cases, {
//     fields: [evidence.caseId],
//     references: [cases.id],
//   }),
//   criminal: one(criminals, {
//     fields: [evidence.criminalId],
//     references: [criminals.id],
//   }),
//   uploadedBy: one(users, {
//     fields: [evidence.uploadedBy],
//     references: [users.id],
//   }),
// }));

// export const caseActivitiesRelations = relations(caseActivities, ({ one }) => ({
//   case: one(cases, {
//     fields: [caseActivities.caseId],
//     references: [cases.id],
//   }),
//   assignedTo: one(users, {
//     fields: [caseActivities.assignedTo],
//     references: [users.id],
//   }),
//   createdBy: one(users, {
//     fields: [caseActivities.createdBy],
//     references: [users.id],
//   }),
// }));

// // Export types
// export type User = typeof users.$inferSelect;
// export type NewUser = typeof users.$inferInsert;
// export type Session = typeof sessions.$inferSelect;
// export type Criminal = typeof criminals.$inferSelect;
// export type Case = typeof cases.$inferSelect;
// export type Evidence = typeof evidence.$inferSelect;
// export type Statute = typeof statutes.$inferSelect;
// export type CaseActivity = typeof caseActivities.$inferSelect;

// All SQLite-specific code is now commented out. Use only schema-new.ts for all DB operations.
