import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { hashPassword } from '$lib/server/auth';
import { createSession, generateSessionToken, setSessionTokenCookie } from '$lib/server/session';
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST(event: RequestEvent) {
  const { name, email, password } = await event.request.json();
  
  try {
    const passwordHash = await hashPassword(password);
    const id = crypto.randomUUID();

    const [newUser] = await db.insert(users).values({ 
      id, 
      email, 
      name: name || null,
      hashedPassword: passwordHash,
      role: 'user' // Default role
    }).returning();
    
    // Create new session
    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, newUser.id);
    
    // Set session cookie
    setSessionTokenCookie(event, sessionToken, session.expiresAt);

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
    console.error('Registration error:', error);
    return json({ message: 'Registration failed' }, { status: 500 });
  }
}
