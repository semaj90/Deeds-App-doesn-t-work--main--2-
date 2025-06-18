import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { cases, criminals, statutes, users, evidence, crimes } from '$lib/server/db/schema';

export type Case = InferSelectModel<typeof cases>;
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
  role?: string | null;
  username?: string | null;
  profile?: { bio?: string } | Record<string, any>;
};