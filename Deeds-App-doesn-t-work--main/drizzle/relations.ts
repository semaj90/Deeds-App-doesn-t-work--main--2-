import { relations } from "drizzle-orm/relations";
import { users, cases, criminals, evidence, sessions, caseActivities, account } from "./schema";

export const casesRelations = relations(cases, ({one, many}) => ({
	user_leadProsecutor: one(users, {
		fields: [cases.leadProsecutor],
		references: [users.id],
		relationName: "cases_leadProsecutor_users_id"
	}),
	user_createdBy: one(users, {
		fields: [cases.createdBy],
		references: [users.id],
		relationName: "cases_createdBy_users_id"
	}),
	evidences: many(evidence),
	caseActivities: many(caseActivities),
}));

export const usersRelations = relations(users, ({many}) => ({
	cases_leadProsecutor: many(cases, {
		relationName: "cases_leadProsecutor_users_id"
	}),
	cases_createdBy: many(cases, {
		relationName: "cases_createdBy_users_id"
	}),
	criminals: many(criminals),
	evidences: many(evidence),
	sessions: many(sessions),
	caseActivities_assignedTo: many(caseActivities, {
		relationName: "caseActivities_assignedTo_users_id"
	}),
	caseActivities_createdBy: many(caseActivities, {
		relationName: "caseActivities_createdBy_users_id"
	}),
	accounts: many(account),
}));

export const criminalsRelations = relations(criminals, ({one, many}) => ({
	user: one(users, {
		fields: [criminals.createdBy],
		references: [users.id]
	}),
	evidences: many(evidence),
}));

export const evidenceRelations = relations(evidence, ({one}) => ({
	case: one(cases, {
		fields: [evidence.caseId],
		references: [cases.id]
	}),
	criminal: one(criminals, {
		fields: [evidence.criminalId],
		references: [criminals.id]
	}),
	user: one(users, {
		fields: [evidence.uploadedBy],
		references: [users.id]
	}),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const caseActivitiesRelations = relations(caseActivities, ({one}) => ({
	case: one(cases, {
		fields: [caseActivities.caseId],
		references: [cases.id]
	}),
	user_assignedTo: one(users, {
		fields: [caseActivities.assignedTo],
		references: [users.id],
		relationName: "caseActivities_assignedTo_users_id"
	}),
	user_createdBy: one(users, {
		fields: [caseActivities.createdBy],
		references: [users.id],
		relationName: "caseActivities_createdBy_users_id"
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(users, {
		fields: [account.userId],
		references: [users.id]
	}),
}));