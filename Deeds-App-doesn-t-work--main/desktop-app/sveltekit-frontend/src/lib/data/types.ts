import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { cases, criminals, statutes, users, evidence, crimes, citationPoints } from '$lib/server/db/schema';

export type Case = InferSelectModel<typeof cases>;
export type NewCase = InferInsertModel<typeof cases>;

export type Criminal = InferSelectModel<typeof criminals>;
export type NewCriminal = InferInsertModel<typeof criminals>;

export type Statute = InferSelectModel<typeof statutes>;
export type NewStatute = InferInsertModel<typeof statutes>;

export type Crime = InferSelectModel<typeof crimes>;
export type NewCrime = InferInsertModel<typeof crimes>;

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Evidence = InferSelectModel<typeof evidence>;
export type NewEvidence = InferInsertModel<typeof evidence>;

// Database-backed Citation Point type
export type CitationPoint = InferSelectModel<typeof citationPoints>;
export type NewCitationPoint = InferInsertModel<typeof citationPoints>;

// Type for the user object returned by Auth.js session
export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null; // Assuming role is part of your session user
};

// Legacy Citation Point interface for LokiJS compatibility  
export interface LegacyCitationPoint {
  id: string;
  summary: string;      // AI-generated snippet
  source: string;       // e.g. "evidence/123"
  labels: string[];
  vector?: number[];    // For semantic search
  createdAt: number;
  updatedAt: number;
  linkedTo?: string;    // Case ID this citation is linked to
}