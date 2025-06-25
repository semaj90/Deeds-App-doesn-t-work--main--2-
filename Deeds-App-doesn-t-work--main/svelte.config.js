import adapter from '@sveltejs/adapter-vercel'; // Switched to Vercel adapter
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess({
		postcss: true,
	}),

	kit: {
		adapter: adapter(), // Use Vercel adapter for deployment
		alias: {
			'$ui/*': './packages/ui/src/lib/*',
			'$lib/*': './packages/lib/src/*'
		}
	}
};

export default config;
