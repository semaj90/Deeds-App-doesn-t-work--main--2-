import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { cases, criminals, users, evidence, statutes } from '$lib/server/db/unified-schema';

export type Case = InferSelectModel<typeof cases>;
export type NewCase = InferInsertModel<typeof cases>;

export type Criminal = InferSelectModel<typeof criminals>;
export type NewCriminal = InferInsertModel<typeof criminals>;

export type Statute = InferSelectModel<typeof statutes>;

export type Evidence = InferSelectModel<typeof evidence>;

export type User = InferSelectModel<typeof users>;

// Type for the user object returned by Auth.js session
export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null; // Assuming role is part of your session user
};