import { signOut } from '$lib/server/auth'; // Import signOut from your SvelteKitAuth setup
import type { Actions } from './$types';

// This action will be called when a form POSTs to /signout
export const actions: Actions = { default: signOut };