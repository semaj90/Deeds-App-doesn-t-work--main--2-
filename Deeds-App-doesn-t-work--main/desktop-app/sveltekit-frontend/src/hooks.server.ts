import { redirect, error } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';
import {
	deleteSessionTokenCookie,
	setSessionTokenCookie,
	validateSessionToken
} from '$lib/server/session';

export const handle: Handle = async ({ event, resolve }) => {
    // Get session token from cookies
    const token = event.cookies.get('session') ?? null;
    
    // Initialize locals
    event.locals.user = null;
    event.locals.session = null;
    
    if (token) {
        const { session, user } = await validateSessionToken(token);
        if (session !== null && user !== null) {
            // Refresh session cookie with updated expiration
            setSessionTokenCookie(event, token, session.expiresAt);
            // Create session object with user included
            event.locals.session = {
                ...session,
                user: user
            };
            event.locals.user = user;
        } else {
            // Invalid or expired session, clean up cookie
            deleteSessionTokenCookie(event);
        }
    }

    // Add auth helper to locals
    event.locals.auth = async () => {
        return {
            user: event.locals.user,
            session: event.locals.session
        };
    };

    // Define public and protected paths
    const protectedPaths = ['/dashboard', '/criminals', '/cases', '/statutes', '/evidence', '/admin'];
    const publicPaths = ['/', '/login', '/register', '/about', '/contact', '/signup'];
    const apiPaths = ['/api/register', '/api/login', '/api/auth/callback'];
    
    const isProtectedRoute = protectedPaths.some(path => event.url.pathname.startsWith(path));
    const isPublicAPI = apiPaths.some(path => event.url.pathname.startsWith(path));
    const isProtectedAPI = event.url.pathname.startsWith('/api/') && !isPublicAPI;

    // Redirect unauthenticated users from protected routes
    if (isProtectedRoute && !event.locals.session?.user) {
        throw redirect(303, `/login?from=${encodeURIComponent(event.url.pathname)}`);
    }

    // Block unauthenticated API calls to protected endpoints
    if (isProtectedAPI && !event.locals.user) {
        throw error(401, { message: 'Unauthorized' });
    }

    // Check admin routes
    const adminRoutes = ['/admin'];
    const isAdminRoute = adminRoutes.some(route => event.url.pathname.startsWith(route));
    if (isAdminRoute && (!event.locals.user || event.locals.user.role !== 'admin')) {
        throw error(403, { message: 'Forbidden' });
    }

    return await resolve(event);
};
