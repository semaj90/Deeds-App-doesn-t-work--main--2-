// See https://svelte.dev/docs/kit/types#app.d.ts

import type { User, Session } from '$lib/server/db/schema';

// Extended session type that includes user
type SessionWithUser = Session & { user: User };

// for information about these interfaces
declare global {
	namespace App {
		interface Error {}
		interface Locals {
			user: User | null;
			session: SessionWithUser | null;
			auth: () => Promise<{ user: User | null; session: SessionWithUser | null }>;
		}
		interface PageData {
			user?: User | null;
		}
		interface PageState {}
		interface Platform {}
	}
}

export {};
