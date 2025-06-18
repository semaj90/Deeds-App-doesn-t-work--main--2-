import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const { user } = await locals.auth.validate();
    if (!user) {
      throw redirect(302, '/login');
    }

    // This server-side action is primarily for authentication check.
    // The actual criminal creation is handled by Tauri invoke in +page.svelte.
    // We can still parse the form data here if needed for server-side validation
    // or logging, but it won't be used to directly interact with the DB.

    return {
      status: 200,
      body: {
        message: 'Form submitted for Tauri processing'
      }
    };
  }
};