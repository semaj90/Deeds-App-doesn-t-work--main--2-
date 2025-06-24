import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, jsonb, text, varchar, timestamp, uuid, numeric, integer, foreignKey, unique, boolean, primaryKey } from "drizzle-orm/pg-core";
import { p as private_env, b as building } from "./environment.js";
const cases = pgTable("cases", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  caseNumber: varchar("case_number", { length: 50 }),
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  incidentDate: timestamp("incident_date", { mode: "string" }),
  location: text(),
  priority: varchar({ length: 20 }).default("medium").notNull(),
  status: varchar({ length: 20 }).default("open").notNull(),
  category: varchar({ length: 50 }),
  dangerScore: integer("danger_score").default(0).notNull(),
  estimatedValue: numeric("estimated_value", { precision: 12, scale: 2 }),
  jurisdiction: varchar({ length: 100 }),
  leadProsecutor: uuid("lead_prosecutor"),
  assignedTeam: jsonb("assigned_team").default([]).notNull(),
  aiSummary: text("ai_summary"),
  aiTags: jsonb("ai_tags").default([]).notNull(),
  metadata: jsonb().default({}).notNull(),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
  closedAt: timestamp("closed_at", { mode: "string" }),
  name: varchar({ length: 255 }),
  summary: text(),
  dateOpened: timestamp("date_opened", { mode: "string" }),
  verdict: varchar({ length: 100 }),
  courtDates: text("court_dates"),
  linkedCriminals: text("linked_criminals"),
  linkedCrimes: text("linked_crimes"),
  notes: text(),
  tags: jsonb().default([]).notNull()
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
  })
]);
const caseLawLinks = pgTable("case_law_links", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  caseId: uuid("case_id").notNull(),
  statuteId: uuid("statute_id"),
  lawParagraphId: uuid("law_paragraph_id"),
  linkType: varchar("link_type", { length: 50 }).notNull(),
  description: text(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull()
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
  })
]);
const lawParagraphs = pgTable("law_paragraphs", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  statuteId: uuid("statute_id").notNull(),
  paragraphNumber: varchar("paragraph_number", { length: 50 }).notNull(),
  content: text().notNull(),
  aiSummary: text("ai_summary"),
  tags: jsonb().default([]).notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
  paragraphText: text("paragraph_text"),
  anchorId: varchar("anchor_id", { length: 100 }),
  linkedCaseIds: jsonb("linked_case_ids").default([]).notNull(),
  crimeSuggestions: jsonb("crime_suggestions").default([]).notNull()
}, (table) => [
  foreignKey({
    columns: [table.statuteId],
    foreignColumns: [statutes.id],
    name: "law_paragraphs_statute_id_statutes_id_fk"
  }).onDelete("cascade")
]);
const crimes = pgTable("crimes", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  caseId: uuid("case_id"),
  criminalId: uuid("criminal_id"),
  statuteId: uuid("statute_id"),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  chargeLevel: varchar("charge_level", { length: 50 }),
  status: varchar({ length: 50 }).default("pending").notNull(),
  incidentDate: timestamp("incident_date", { mode: "string" }),
  arrestDate: timestamp("arrest_date", { mode: "string" }),
  filingDate: timestamp("filing_date", { mode: "string" }),
  notes: text(),
  aiSummary: text("ai_summary"),
  metadata: jsonb().default({}).notNull(),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull()
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
  })
]);
const contentEmbeddings = pgTable("content_embeddings", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: uuid("entity_id").notNull(),
  contentType: varchar("content_type", { length: 50 }).notNull(),
  embedding: jsonb().notNull(),
  text: text().notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull()
});
const criminals = pgTable("criminals", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  middleName: varchar("middle_name", { length: 100 }),
  aliases: jsonb().default([]).notNull(),
  dateOfBirth: timestamp("date_of_birth", { mode: "string" }),
  address: text(),
  phone: varchar({ length: 20 }),
  email: varchar({ length: 255 }),
  height: integer(),
  weight: integer(),
  eyeColor: varchar("eye_color", { length: 20 }),
  hairColor: varchar("hair_color", { length: 20 }),
  distinguishingMarks: text("distinguishing_marks"),
  photoUrl: text("photo_url"),
  threatLevel: varchar("threat_level", { length: 20 }).default("low").notNull(),
  status: varchar({ length: 20 }).default("active").notNull(),
  priors: jsonb().default([]).notNull(),
  convictions: jsonb().default([]).notNull(),
  notes: text(),
  aiSummary: text("ai_summary"),
  aiTags: jsonb("ai_tags").default([]).notNull(),
  aiAnalysis: jsonb("ai_analysis").default({}).notNull(),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
  name: varchar({ length: 255 }),
  convictionStatus: varchar("conviction_status", { length: 50 }),
  sentenceLength: varchar("sentence_length", { length: 100 }),
  convictionDate: timestamp("conviction_date", { mode: "string" }),
  escapeAttempts: integer("escape_attempts").default(0),
  gangAffiliations: text("gang_affiliations")
}, (table) => [
  foreignKey({
    columns: [table.createdBy],
    foreignColumns: [users.id],
    name: "criminals_created_by_users_id_fk"
  })
]);
const evidence = pgTable("evidence", {
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
  uploadedAt: timestamp("uploaded_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
  fileName: varchar("file_name", { length: 255 }),
  summary: text(),
  aiSummary: text("ai_summary")
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
  })
]);
const sessions = pgTable("sessions", {
  id: text().primaryKey().notNull(),
  userId: uuid("user_id").notNull(),
  expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull()
}, (table) => [
  foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: "sessions_user_id_users_id_fk"
  }).onDelete("cascade")
]);
const statutes = pgTable("statutes", {
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
  effectiveDate: timestamp("effective_date", { mode: "string" }),
  aiSummary: text("ai_summary"),
  tags: jsonb().default([]).notNull(),
  relatedStatutes: jsonb("related_statutes").default([]).notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
  name: varchar({ length: 255 }),
  sectionNumber: varchar("section_number", { length: 50 })
}, (table) => [
  unique("statutes_code_unique").on(table.code)
]);
const users = pgTable("users", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  email: varchar({ length: 255 }).notNull(),
  emailVerified: timestamp("email_verified", { mode: "string" }),
  hashedPassword: text("hashed_password"),
  role: varchar({ length: 50 }).default("prosecutor").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
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
  provider: varchar({ length: 50 }).default("credentials"),
  profile: jsonb().default({})
}, (table) => [
  unique("users_email_unique").on(table.email)
]);
const caseActivities = pgTable("case_activities", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  caseId: uuid("case_id").notNull(),
  activityType: varchar("activity_type", { length: 50 }).notNull(),
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  scheduledFor: timestamp("scheduled_for", { mode: "string" }),
  completedAt: timestamp("completed_at", { mode: "string" }),
  status: varchar({ length: 20 }).default("pending").notNull(),
  priority: varchar({ length: 20 }).default("medium").notNull(),
  assignedTo: uuid("assigned_to"),
  relatedEvidence: jsonb("related_evidence").default([]).notNull(),
  relatedCriminals: jsonb("related_criminals").default([]).notNull(),
  metadata: jsonb().default({}).notNull(),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull()
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
  })
]);
const verificationToken = pgTable("verificationToken", {
  identifier: text().notNull(),
  token: text().notNull(),
  expires: timestamp({ mode: "string" }).notNull()
}, (table) => [
  primaryKey({ columns: [table.identifier, table.token], name: "verificationToken_identifier_token_pk" })
]);
const account = pgTable("account", {
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
  sessionState: text("session_state")
}, (table) => [
  foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: "account_userId_users_id_fk"
  }).onDelete("cascade"),
  primaryKey({ columns: [table.provider, table.providerAccountId], name: "account_provider_providerAccountId_pk" })
]);
const schema = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  account,
  caseActivities,
  caseLawLinks,
  cases,
  contentEmbeddings,
  crimes,
  criminals,
  evidence,
  lawParagraphs,
  sessions,
  statutes,
  users,
  verificationToken
}, Symbol.toStringTag, { value: "Module" }));
let _db = null;
let _pool = null;
function initializeDatabase() {
  if (building) {
    console.log("Skipping database initialization during build");
    return null;
  }
  if (_db) return _db;
  const connectionString = private_env.DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set.");
  }
  console.log("Connecting to database...");
  _pool = new Pool({
    connectionString,
    ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false }
  });
  _db = drizzle(_pool, { schema });
  console.log("Database connection established.");
  return _db;
}
const db = new Proxy({}, {
  get(target, prop) {
    const actualDb = initializeDatabase();
    if (!actualDb) {
      if (prop === "query") {
        return new Proxy(
          {},
          {
            get: (target2, prop2) => {
              return () => {
                console.warn(
                  `Database accessed during build phase. Method: query.${String(prop2)}`
                );
                return Promise.resolve([]);
              };
            }
          }
        );
      }
      return () => {
        console.warn(`Database accessed during build phase. Property: ${String(prop)}`);
        return Promise.resolve([]);
      };
    }
    if (typeof actualDb[prop] === "function") {
      return actualDb[prop].bind(actualDb);
    }
    return actualDb[prop];
  }
});
async function gracefulShutdown() {
  if (_pool) {
    console.log("Closing database pool...");
    await _pool.end();
    console.log("Database pool closed.");
  }
}
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
export {
  criminals as a,
  crimes as b,
  cases as c,
  db as d,
  evidence as e,
  users as u
};
