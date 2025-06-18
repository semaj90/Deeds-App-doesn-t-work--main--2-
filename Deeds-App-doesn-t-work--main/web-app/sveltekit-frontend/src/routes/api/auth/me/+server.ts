import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyToken } from '$lib/server/auth';
import { validateSessionToken } from '$lib/server/session';

export const GET: RequestHandler = async ({ request, cookies, locals }) => {
    // This endpoint demonstrates the hybrid auth approach
    // It accepts both session cookies (web) and JWT tokens (API)
    
    let user = null;
    let authMethod = 'none';

    // First, check if user is already authenticated via session (from hooks)
    if (locals.user) {
        user = locals.user;
        authMethod = 'session';
    } else {
        // Check for JWT token in Authorization header (for API clients)
        const authHeader = request.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
            const jwtToken = authHeader.substring(7);
            const jwtUser = await verifyToken(jwtToken);
            if (jwtUser) {
                user = jwtUser;
                authMethod = 'jwt';
            }
        }
        
        // Also check for JWT in cookies (fallback)
        if (!user) {
            const jwtCookie = cookies.get('jwt');
            if (jwtCookie) {
                const jwtUser = await verifyToken(jwtCookie);
                if (jwtUser) {
                    user = jwtUser;
                    authMethod = 'jwt-cookie';
                }
            }
        }
    }

    if (!user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return user info with authentication method used
    return json({
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        },
        authMethod,
        message: `Authenticated via ${authMethod}`
    });
};
