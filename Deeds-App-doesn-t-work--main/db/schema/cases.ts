// Cases Management Schema
// Core case management tables for the prosecutor system

import { pgTable, text, varchar, timestamp, jsonb, boolean, uuid, integer, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { timestamps, createId, createStatusEnum } from './_shared';
import { users } from './auth';

// === CASES TABLE ===
export const cases = pgTable('cases', {
  id: createId(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  caseNumber: varchar('case_number', { length: 100 }).unique(),
  status: createStatusEnum('status', ['open', 'closed', 'pending', 'dismissed']),
  priority: createStatusEnum('priority', ['low', 'medium', 'high', 'urgent']),
  
  // User ownership
  createdBy: uuid('created_by').references(() => users.id),
  
  // Prosecutor assignment
  assignedProsecutorId: uuid('assigned_prosecutor_id').references(() => users.id),
  
  // Case details
  jurisdiction: varchar('jurisdiction', { length: 200 }),
  courtRoom: varchar('court_room', { length: 100 }),
  judge: varchar('judge', { length: 200 }),
  verdict: text('verdict'),
  
  // Important dates
  incidentDate: timestamp('incident_date', { mode: 'date' }),
  filingDate: timestamp('filing_date', { mode: 'date' }),
  trialDate: timestamp('trial_date', { mode: 'date' }),
  closedDate: timestamp('closed_date', { mode: 'date' }),
  
  // Case metadata
  tags: jsonb('tags').default([]).notNull(),
  severity: varchar('severity', { length: 50 }),
  caseType: varchar('case_type', { length: 100 }),
  location: text('location'),
  
  // AI and analytics
  aiSummary: text('ai_summary'),
  aiTags: jsonb('ai_tags').default([]).notNull(),
  dangerScore: decimal('danger_score', { precision: 3, scale: 2 }),
  riskScore: decimal('risk_score', { precision: 3, scale: 2 }),
  confidenceLevel: decimal('confidence_level', { precision: 3, scale: 2 }),
  
  // Case data storage
  data: jsonb('data').default({}).notNull(),
  
  // Legacy/compatibility fields
  address: text('address'),
  county: varchar('county', { length: 100 }),
  
  ...timestamps,
});

// === CASE EVENTS ===
export const caseEvents = pgTable('case_events', {
  id: createId(),
  caseId: uuid('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id),
  
  eventType: varchar('event_type', { length: 100 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  eventDate: timestamp('event_date', { mode: 'date' }).notNull(),
  timestamp: timestamp('timestamp', { mode: 'date' }).notNull(), // alias for eventDate
  
  metadata: jsonb('metadata').default({}).notNull(),
  eventData: jsonb('event_data').default({}).notNull(), // alias for metadata
  isPublic: boolean('is_public').default(false).notNull(),
  
  ...timestamps,
});

// === CASE RELATIONSHIPS ===
export const caseRelationships = pgTable('case_relationships', {
  id: createId(),
  parentCaseId: uuid('parent_case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  childCaseId: uuid('child_case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  relatedCaseId: uuid('related_case_id').references(() => cases.id), // alias for childCaseId
  
  relationshipType: varchar('relationship_type', { length: 50 }).notNull(), // 'related', 'merged', 'split'
  description: text('description'),
  strength: varchar('strength', { length: 50 }), // updated to varchar for compatibility
  
  ...timestamps,
});

// === CASE TEMPLATES ===
export const caseTemplates = pgTable('case_templates', {
  id: createId(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  caseType: varchar('case_type', { length: 100 }),
  
  template: jsonb('template').notNull(),
  fields: jsonb('fields').default([]).notNull(), // template fields
  isActive: boolean('is_active').default(true).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  
  // Usage tracking
  usageCount: integer('usage_count').default(0).notNull(),
  
  ...timestamps,
});

// === CASE ACTIVITIES ===
export const caseActivities = pgTable('case_activities', {
  id: createId(),
  caseId: uuid('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id),
  
  activityType: varchar('activity_type', { length: 100 }).notNull(),
  description: text('description').notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  
  // Activity tracking
  duration: integer('duration'), // in minutes
  billableHours: decimal('billable_hours', { precision: 4, scale: 2 }),
  
  // Scheduling
  scheduledFor: timestamp('scheduled_for', { mode: 'date' }),
  completedAt: timestamp('completed_at', { mode: 'date' }),
  
  isImportant: boolean('is_important').default(false).notNull(),
  isConfidential: boolean('is_confidential').default(false).notNull(),
  
  ...timestamps,
});

// === RELATIONS ===
export const casesRelations = relations(cases, ({ one, many }) => ({
  assignedProsecutor: one(users, {
    fields: [cases.assignedProsecutorId],
    references: [users.id],
  }),
  events: many(caseEvents),
  activities: many(caseActivities),
  parentRelationships: many(caseRelationships, {
    relationName: 'parentCase',
  }),
  childRelationships: many(caseRelationships, {
    relationName: 'childCase',
  }),
}));

export const caseEventsRelations = relations(caseEvents, ({ one }) => ({
  case: one(cases, {
    fields: [caseEvents.caseId],
    references: [cases.id],
  }),
  user: one(users, {
    fields: [caseEvents.userId],
    references: [users.id],
  }),
}));

export const caseActivitiesRelations = relations(caseActivities, ({ one }) => ({
  case: one(cases, {
    fields: [caseActivities.caseId],
    references: [cases.id],
  }),
  user: one(users, {
    fields: [caseActivities.userId],
    references: [users.id],
  }),
}));

export const caseRelationshipsRelations = relations(caseRelationships, ({ one }) => ({
  parentCase: one(cases, {
    fields: [caseRelationships.parentCaseId],
    references: [cases.id],
    relationName: 'parentCase',
  }),
  childCase: one(cases, {
    fields: [caseRelationships.childCaseId],
    references: [cases.id],
    relationName: 'childCase',
  }),
}));

export const caseTemplatesRelations = relations(caseTemplates, ({ one }) => ({
  creator: one(users, {
    fields: [caseTemplates.createdBy],
    references: [users.id],
  }),
}));
