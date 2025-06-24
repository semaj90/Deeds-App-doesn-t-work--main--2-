import { redirect, error } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    // Initialize locals
    event.locals.user = null;
    event.locals.session = null;

    // Define public and protected paths
    const protectedPaths = ['/dashboard', '/cases', '/evidence', '/profile'];
    const publicPaths = ['/', '/login', '/register'];
    const apiPaths = ['/api/auth/register', '/api/auth/login'];
    
    const isProtectedRoute = protectedPaths.some(path => event.url.pathname.startsWith(path));
    const isPublicAPI = apiPaths.some(path => event.url.pathname.startsWith(path));
    const isProtectedAPI = event.url.pathname.startsWith('/api/') && !isPublicAPI;

    // For now, skip authentication checks - we'll add this later
    // if (isProtectedRoute && !event.locals.user) {
    //     throw redirect(303, `/login?from=${encodeURIComponent(event.url.pathname)}`);
    // }

    return resolve(event);
};
