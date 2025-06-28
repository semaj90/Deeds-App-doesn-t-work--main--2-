import { db } from '../../../lib/server/db/index.js';
import { users } from '../../../lib/server/db/schema.js';
import bcrypt from 'bcrypt';
import { createSession, generateSessionToken, setSessionTokenCookie } from '../../../lib/server/session.js';
import { eq } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST(event: RequestEvent) {
  try {
    console.log('=== LOGIN ENDPOINT CALLED ===');
    const { email, password } = await event.request.json();
    
    console.log('Email received:', JSON.stringify(email));
    console.log('Password received:', password ? `[${password.length} chars]` : 'null/undefined');
    
    console.log('=== QUERYING DATABASE ===');
    const [user] = await db.select().from(users).where(eq(users.email, email));
    
    console.log('Database query result:', !!user);
    
    if (!user) {
      console.log('❌ No user found with email:', email);
      return json({ message: 'Invalid credentials' }, { status: 401 });
    }
    
    console.log('✅ User found:', { 
      id: user.id, 
      email: user.email, 
      hasPassword: !!user.hashedPassword,
      passwordLength: user.hashedPassword?.length 
    });
    
    if (!user.hashedPassword) {
      console.log('❌ User has no password hash');
      return json({ message: 'Invalid credentials' }, { status: 401 });
    }

    console.log('=== COMPARING PASSWORDS ===');
    console.log('Input password:', password);
    console.log('Stored hash:', user.hashedPassword);
    
    const passwordMatch = await bcrypt.compare(password, user.hashedPassword);
    console.log('Password match result:', passwordMatch);
    
    if (!passwordMatch) {
      console.log('❌ Password does not match');
      return json({ message: 'Invalid credentials' }, { status: 401 });
    }

    console.log('✅ Password matches! Creating session...');
    
    // Create new session
    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, user.id);
    
    // Set session cookie
    setSessionTokenCookie(event, sessionToken, new Date(session.expiresAt));
    
    console.log('✅ Session created and cookie set');
    
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
    console.error('❌ Login error:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
      return json({ message: 'Internal server error', details: error.message }, { status: 500 });
    }
    return json({ message: 'Internal server error' }, { status: 500 });
  }
}
