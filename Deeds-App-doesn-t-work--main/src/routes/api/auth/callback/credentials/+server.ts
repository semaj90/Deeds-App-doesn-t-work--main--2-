import { json, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { createSession, generateSessionToken, setSessionTokenCookie } from '$lib/server/session';
import type { RequestHandler } from './$types';

import { json, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '$lib/server/authUtils';
import { createSession, generateSessionToken, setSessionTokenCookie } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies, url }) => {
  try {
    const formData = await request.formData();
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();
    const callbackUrl = url.searchParams.get('callbackUrl') || '/dashboard';

    if (!email || !password) {
      return json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Find user by email
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (!user || !user.hashedPassword) {
      return json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.hashedPassword);
    
    if (!isValidPassword) {
      return json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create session
    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, user.id);
    
    // Set session cookie
    setSessionTokenCookie({ cookies } as any, sessionToken, session.expiresAt);

    // Redirect to callback URL
    throw redirect(303, callbackUrl);
  } catch (error) {
    if (error instanceof Response) {
      throw error; // Re-throw redirects
    }
    console.error('Login error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
