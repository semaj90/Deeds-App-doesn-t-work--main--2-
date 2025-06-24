// See https://svelte.dev/docs/kit/types#app.d.ts

// for information about these interfaces
declare global {
	namespace App {
		interface Error {}
		interface Locals {
			user: any | null;
			session: any | null;
		}
		interface PageData {
			user?: any | null;
		}
		interface PageState {}
		interface Platform {}
	}
}

/// <reference types="@sveltejs/kit" />

export {};
