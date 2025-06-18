import { signOut } from '$lib/server/auth'; // Use signOut from your main auth setup
import { redirect } from '@sveltejs/kit';

export async function GET({ request }) {
    await signOut(); // Auth.js signOut handles cookie clearing etc.
    throw redirect(302, '/login'); // Redirect to login page
}