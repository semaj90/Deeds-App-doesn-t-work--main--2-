import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { cases, criminals, statutes, users, evidence, crimes } from '$lib/server/db/schema';

// --- Book type for Case Books feature ---
// TODO: Implement backend support for books and link to cases
export type Book = {
  id: string;
  title: string;
  author?: string;
  description?: string;
  publishedAt?: string | Date;
  // Add more fields as needed
};

// --- Unified Case type with all UI/AI fields and books ---
export type Case = InferSelectModel<typeof cases> & {
  // AI/semantic fields
  aiSummary?: string | null;
  aiTags?: string[];
  dangerScore?: number;
  embedding?: number[];
  // UI/UX fields
  evidenceCount?: number;
  formattedDate?: string;
  timeAgo?: string;
  nlpInsights?: any;
  // Case books feature
  books?: Book[]; // TODO: Populate from backend when available
  // Advanced/related features
  relatedCases?: string[]; // TODO: Replace with RelatedCase[] if available
  // Add more as needed for UI completeness
};

export type NewCase = InferInsertModel<typeof cases>;

export type Criminal = Omit<InferSelectModel<typeof criminals>, 'name'> & {
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  address: string | null;
  email: string | null;
};
export type NewCriminal = Omit<InferInsertModel<typeof criminals>, 'name'> & {
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  address: string | null;
  email: string | null;
};

export type Statute = InferSelectModel<typeof statutes>;

export type Crime = InferSelectModel<typeof crimes>;

export type Evidence = InferSelectModel<typeof evidence>;

export type User = InferSelectModel<typeof users> & {
  username?: string;
  image?: string | null;
  profile?: { bio?: string } | Record<string, any>;
  role?: string | null;
};

// Type for the user object returned by Auth.js session
export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

// --- TODO: Add types for advanced AI/semantic features as needed ---