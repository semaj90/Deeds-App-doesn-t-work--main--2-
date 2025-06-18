import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
    // Get the current path
    const path = url.pathname;

    // List of paths that don't require authentication
    const publicPaths = ['/login', '/register', '/signup', '/', '/about', '/contact'];

    // Check if the current path is public
    const isPublicPath = publicPaths.some((pp) => path === pp || path.startsWith(pp));

    // Return user data for all routes (template pattern)
    // The actual authentication redirect is handled in hooks.server.ts
    return {
        user: locals.user,
        session: locals.session,
        isAuthenticated: !!locals.user,
        isPublicPath
    };
};