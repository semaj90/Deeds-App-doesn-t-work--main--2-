import { relations } from "drizzle-orm/relations";
import { users, cases, caseLawLinks, statutes, lawParagraphs, crimes, criminals, evidence, sessions, caseActivities, account } from "./schema";

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
	caseLawLinks: many(caseLawLinks),
	crimes: many(crimes),
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
	crimes: many(crimes),
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

export const caseLawLinksRelations = relations(caseLawLinks, ({one}) => ({
	case: one(cases, {
		fields: [caseLawLinks.caseId],
		references: [cases.id]
	}),
	statute: one(statutes, {
		fields: [caseLawLinks.statuteId],
		references: [statutes.id]
	}),
	lawParagraph: one(lawParagraphs, {
		fields: [caseLawLinks.lawParagraphId],
		references: [lawParagraphs.id]
	}),
}));

export const statutesRelations = relations(statutes, ({many}) => ({
	caseLawLinks: many(caseLawLinks),
	lawParagraphs: many(lawParagraphs),
	crimes: many(crimes),
}));

export const lawParagraphsRelations = relations(lawParagraphs, ({one, many}) => ({
	caseLawLinks: many(caseLawLinks),
	statute: one(statutes, {
		fields: [lawParagraphs.statuteId],
		references: [statutes.id]
	}),
}));

export const crimesRelations = relations(crimes, ({one}) => ({
	case: one(cases, {
		fields: [crimes.caseId],
		references: [cases.id]
	}),
	criminal: one(criminals, {
		fields: [crimes.criminalId],
		references: [criminals.id]
	}),
	statute: one(statutes, {
		fields: [crimes.statuteId],
		references: [statutes.id]
	}),
	user: one(users, {
		fields: [crimes.createdBy],
		references: [users.id]
	}),
}));

export const criminalsRelations = relations(criminals, ({one, many}) => ({
	crimes: many(crimes),
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