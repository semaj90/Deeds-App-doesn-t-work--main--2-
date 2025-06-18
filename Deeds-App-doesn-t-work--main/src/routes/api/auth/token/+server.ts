import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { comparePasswords, signToken } from '$lib/server/auth';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
    // This endpoint issues JWT tokens for API clients
    // Use this for mobile apps, third-party integrations, etc.
    
    const { email, password } = await request.json();
    
    if (!email || !password) {
        return json({ error: 'Email and password required' }, { status: 400 });
    }
    
    try {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        
        if (!user || !(await comparePasswords(password, user.hashedPassword ?? ''))) {
            return json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Generate JWT token for API use
        const jwtToken = signToken({ 
            userId: user.id, 
            role: user.role 
        });
        
        return json({ 
            success: true,
            token: jwtToken,
            user: { 
                id: user.id, 
                email: user.email, 
                name: user.name, 
                role: user.role 
            },
            message: 'JWT token issued successfully'
        });
    } catch (error) {
        console.error('JWT login error:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
};
