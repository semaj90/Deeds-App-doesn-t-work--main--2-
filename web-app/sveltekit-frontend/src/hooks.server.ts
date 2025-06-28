import { redirect, error } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const handle: Handle = async ({ event, resolve }) => {
    // Initialize locals
    event.locals.user = null;
    event.locals.session = null;

    // Check for session token in cookies
    const sessionToken = event.cookies.get('session');
    
    if (sessionToken) {
        try {
            // Decode the session token (for now, it's just the user ID)
            const userId = sessionToken;
            
            // Fetch user from database
            const user = await db.query.users.findFirst({
                where: eq(users.id, userId),
                columns: {
                    id: true,
                    email: true,
                    name: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    avatarUrl: true
                }
            });

            if (user) {
                event.locals.user = user;
            }
        } catch (error) {
            console.error('Session validation error:', error);
            // Clear invalid session
            event.cookies.delete('session', { path: '/' });
        }
    }

    // Define public and protected paths
    const protectedPaths = ['/dashboard', '/cases', '/evidence', '/profile'];
    const publicPaths = ['/', '/login', '/register'];
    const apiPaths = ['/api/auth/register', '/api/auth/login'];
    
    const isProtectedRoute = protectedPaths.some(path => event.url.pathname.startsWith(path));
    const isPublicAPI = apiPaths.some(path => event.url.pathname.startsWith(path));
    const isProtectedAPI = event.url.pathname.startsWith('/api/') && !isPublicAPI;

    // Redirect to login if accessing protected route without authentication
    if (isProtectedRoute && !event.locals.user) {
        throw redirect(303, `/login?from=${encodeURIComponent(event.url.pathname)}`);
    }

    // For protected API routes, return 401 if not authenticated
    if (isProtectedAPI && !event.locals.user) {
        return new Response(JSON.stringify({ error: 'Not authenticated' }), {
            status: 401,
            headers: { 'content-type': 'application/json' }
        });
    }

    return resolve(event);
};
