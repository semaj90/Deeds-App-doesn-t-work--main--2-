// Legal Entities Schema
// Criminals, Crimes, and Legal Statutes

import { pgTable, text, varchar, timestamp, jsonb, boolean, uuid, integer, decimal, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { timestamps, createId, createStatusEnum } from './_shared';
import { users } from './auth';
import { cases } from './cases';

// === CRIMINALS TABLE ===
export const criminals = pgTable('criminals', {
  id: createId(),
  
  // Personal information
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  middleName: varchar('middle_name', { length: 100 }),
  aliases: jsonb('aliases').default([]).notNull(),
  
  // Identification
  ssn: varchar('ssn', { length: 11 }), // encrypted
  driverLicense: varchar('driver_license', { length: 50 }),
  passportNumber: varchar('passport_number', { length: 20 }),
  
  // Demographics
  dateOfBirth: date('date_of_birth'),
  gender: varchar('gender', { length: 20 }),
  race: varchar('race', { length: 50 }),
  ethnicity: varchar('ethnicity', { length: 50 }),
  nationality: varchar('nationality', { length: 100 }),
  
  // Physical description
  height: integer('height'), // in cm
  weight: integer('weight'), // in kg
  eyeColor: varchar('eye_color', { length: 20 }),
  hairColor: varchar('hair_color', { length: 20 }),
  distinguishingMarks: text('distinguishing_marks'),
  
  // Contact information
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  zipCode: varchar('zip_code', { length: 10 }),
  country: varchar('country', { length: 100 }),
  
  // Criminal record
  criminalHistory: jsonb('criminal_history').default([]).notNull(),
  riskLevel: varchar('risk_level', { length: 20 }).default('unknown'),
  status: createStatusEnum('status', ['active', 'incarcerated', 'deceased', 'unknown']),
  
  // Photos and biometrics
  photos: jsonb('photos').default([]).notNull(),
  fingerprints: jsonb('fingerprints').default({}).notNull(),
  
  // Investigation notes
  notes: text('notes'),
  knownAssociates: jsonb('known_associates').default([]).notNull(),
  
  // Metadata
  isConfidential: boolean('is_confidential').default(true).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  
  ...timestamps,
});

// === CRIMES TABLE ===
export const crimes = pgTable('crimes', {
  id: createId(),
  
  // Crime identification
  crimeType: varchar('crime_type', { length: 100 }).notNull(),
  crimeCode: varchar('crime_code', { length: 50 }),
  severity: varchar('severity', { length: 20 }),
  classification: varchar('classification', { length: 100 }),
  
  // Description
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  modus_operandi: text('modus_operandi'),
  
  // Location and time
  location: text('location'),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  zipCode: varchar('zip_code', { length: 10 }),
  coordinates: jsonb('coordinates'), // lat/lng
  
  // Timing
  occurredAt: timestamp('occurred_at', { mode: 'date' }),
  reportedAt: timestamp('reported_at', { mode: 'date' }),
  discoveredAt: timestamp('discovered_at', { mode: 'date' }),
  
  // Investigation details
  status: createStatusEnum('status', ['reported', 'investigating', 'solved', 'cold', 'closed']),
  leadInvestigator: uuid('lead_investigator').references(() => users.id),
  assignedProsecutor: uuid('assigned_prosecutor').references(() => users.id),
  
  // Evidence and witnesses
  evidenceList: jsonb('evidence_list').default([]).notNull(),
  witnesses: jsonb('witnesses').default([]).notNull(),
  suspects: jsonb('suspects').default([]).notNull(),
  
  // Case connection
  relatedCaseId: uuid('related_case_id').references(() => cases.id),
  
  // Metadata
  tags: jsonb('tags').default([]).notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  
  ...timestamps,
});

// === STATUTES TABLE ===
export const statutes = pgTable('statutes', {
  id: createId(),
  
  // Statute identification
  code: varchar('code', { length: 100 }).notNull().unique(),
  title: varchar('title', { length: 500 }).notNull(),
  chapter: varchar('chapter', { length: 100 }),
  section: varchar('section', { length: 100 }),
  subsection: varchar('subsection', { length: 100 }),
  
  // Content
  fullText: text('full_text').notNull(),
  summary: text('summary'),
  
  // Classification
  category: varchar('category', { length: 100 }),
  jurisdiction: varchar('jurisdiction', { length: 100 }),
  severity: varchar('severity', { length: 50 }),
  
  // Penalties
  minimumPenalty: text('minimum_penalty'),
  maximumPenalty: text('maximum_penalty'),
  fineRange: varchar('fine_range', { length: 100 }),
  
  // Legal details
  isActive: boolean('is_active').default(true).notNull(),
  effectiveDate: date('effective_date'),
  expirationDate: date('expiration_date'),
  
  // References
  relatedStatutes: jsonb('related_statutes').default([]).notNull(),
  precedents: jsonb('precedents').default([]).notNull(),
  
  // Metadata
  tags: jsonb('tags').default([]).notNull(),
  
  ...timestamps,
});

// === LAW PARAGRAPHS (for detailed statute breakdown) ===
export const lawParagraphs = pgTable('law_paragraphs', {
  id: createId(),
  statuteId: uuid('statute_id').notNull().references(() => statutes.id, { onDelete: 'cascade' }),
  
  paragraphNumber: varchar('paragraph_number', { length: 20 }),
  content: text('content').notNull(),
  interpretation: text('interpretation'),
  
  // Analysis
  keyTerms: jsonb('key_terms').default([]).notNull(),
  relatedCases: jsonb('related_cases').default([]).notNull(),
  
  // Metadata
  isActive: boolean('is_active').default(true).notNull(),
  
  ...timestamps,
});

// === CASE-CRIMINAL RELATIONSHIPS ===
export const caseCriminals = pgTable('case_criminals', {
  id: createId(),
  caseId: uuid('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  criminalId: uuid('criminal_id').notNull().references(() => criminals.id, { onDelete: 'cascade' }),
  
  role: varchar('role', { length: 50 }).notNull(), // 'suspect', 'defendant', 'witness', 'victim'
  status: varchar('status', { length: 50 }),
  
  // Legal status
  chargeDate: timestamp('charge_date', { mode: 'date' }),
  charges: jsonb('charges').default([]).notNull(),
  plea: varchar('plea', { length: 50 }),
  
  // Notes
  notes: text('notes'),
  
  ...timestamps,
});

// === RELATIONS ===
export const criminalsRelations = relations(criminals, ({ one, many }) => ({
  creator: one(users, {
    fields: [criminals.createdBy],
    references: [users.id],
  }),
  caseCriminals: many(caseCriminals),
}));

export const crimesRelations = relations(crimes, ({ one }) => ({
  leadInvestigator: one(users, {
    fields: [crimes.leadInvestigator],
    references: [users.id],
  }),
  assignedProsecutor: one(users, {
    fields: [crimes.assignedProsecutor],
    references: [users.id],
  }),
  relatedCase: one(cases, {
    fields: [crimes.relatedCaseId],
    references: [cases.id],
  }),
}));

export const statutesRelations = relations(statutes, ({ many }) => ({
  paragraphs: many(lawParagraphs),
}));

export const lawParagraphsRelations = relations(lawParagraphs, ({ one }) => ({
  statute: one(statutes, {
    fields: [lawParagraphs.statuteId],
    references: [statutes.id],
  }),
}));

export const caseCriminalsRelations = relations(caseCriminals, ({ one }) => ({
  case: one(cases, {
    fields: [caseCriminals.caseId],
    references: [cases.id],
  }),
  criminal: one(criminals, {
    fields: [caseCriminals.criminalId],
    references: [criminals.id],
  }),
}));
