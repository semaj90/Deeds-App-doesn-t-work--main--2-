import { deleteSessionTokenCookie, invalidateSession } from '$lib/server/session';
import { redirect } from '@sveltejs/kit';

export async function GET({ cookies, locals }) {
    if (locals.session) {
        await invalidateSession(locals.session.id);
    }
    deleteSessionTokenCookie(cookies);
    throw redirect(302, '/login'); // Redirect to login page
}