import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { hashPassword } from '$lib/server/authUtils';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { name, email, password } = await request.json();
        console.log('[Register API] Received data:', { name, email, password: '***' });

        if (!email || !password || !name) {
            return json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await db.select({
            id: users.id,
            email: users.email
        }).from(users).where(eq(users.email, email)).limit(1);
        
        if (existingUser.length > 0) {
            return json({ error: 'User already exists' }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const [newUser] = await db.insert(users).values({
            email,
            hashedPassword,
            name,
            firstName: name.split(' ')[0] || '',
            lastName: name.split(' ').slice(1).join(' ') || '',
            role: 'prosecutor'
        }).returning();

        console.log('[Register API] User created successfully:', newUser.id);

        return json({ 
            success: true, 
            user: { 
                id: newUser.id, 
                email: newUser.email, 
                name: newUser.name,
                role: newUser.role 
            } 
        });
        
    } catch (error) {
        console.error('[Register API] Error:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
};