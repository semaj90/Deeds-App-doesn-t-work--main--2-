// See https://svelte.dev/docs/kit/types#app.d.ts

import type { User, Session } from '$lib/server/db/schema';

// for information about these interfaces
declare global {
	namespace App {
		interface Error {}
		interface Locals {
			user: User | null;
			session: Session | null;
			auth: () => Promise<{ user: User | null; session: Session | null }>;
		}
		interface PageData {
			user?: User | null;
		}
		interface PageState {}
		interface Platform {}
	}
}

// Environment variable types
declare module '$env/static/private' {
	export const DATABASE_URL: string;
	export const DATABASE_DIALECT: string;
	export const AUTH_SECRET: string;
	export const JWT_SECRET: string;
	export const SESSION_SECRET: string;
	export const NODE_ENV: string;
}

export {};
