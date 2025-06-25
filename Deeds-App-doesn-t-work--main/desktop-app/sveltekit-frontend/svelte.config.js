// Copilot Instructions:
// - This is the SvelteKit config for the Tauri desktop app
// - Path aliases should point to shared packages (ui, lib) in the monorepo
// - Ensure all enhanced features from web app are accessible here

import adapter from '@sveltejs/adapter-static'; // Use static adapter for Tauri
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess({
		postcss: true,
	}),

	kit: {
		adapter: adapter({
			fallback: 'index.html' // For SPA fallback in Tauri
		}),
		alias: {
			// Shared UI components from monorepo
			'$ui': path.resolve(__dirname, '../../packages/ui/src/lib'),
			// Shared logic/stores from monorepo  
			'$shared': path.resolve(__dirname, '../../packages/lib/src'),
		},
		prerender: {
			handleMissingId: 'warn' // For Tauri compatibility
		}
	}
};

export default config;
