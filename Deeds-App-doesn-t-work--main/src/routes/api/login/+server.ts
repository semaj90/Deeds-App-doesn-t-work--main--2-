import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { comparePasswords } from '$lib/server/auth';
import { createSession, generateSessionToken, setSessionTokenCookie } from '$lib/server/session';
import { eq } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST(event: RequestEvent) {
  const { email, password } = await event.request.json();
  
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    
    if (!user || !(await comparePasswords(password, user.hashedPassword ?? ''))) {
      return json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Create new session
    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, user.id);
    
    // Set session cookie
    setSessionTokenCookie(event, sessionToken, session.expiresAt);
    
    return json({ 
      success: true, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    return json({ message: 'Internal server error' }, { status: 500 });
  }
}
