import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { verifyPassword } from '$lib/server/authUtils';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return json({ error: 'Email and password are required' }, { status: 400 });
    }
    
    // Find user in database
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        hashedPassword: true,
        avatarUrl: true
      }
    });
    
    if (!user || !user.hashedPassword) {
      return json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(password, user.hashedPassword);
    
    if (!isValidPassword) {
      return json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // Set session cookie (for now, use user ID as session token)
    cookies.set('session', user.id, {
      path: '/',
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    
    // Return user info (excluding password)
    const { hashedPassword, ...userInfo } = user;
    
    return json({ 
      success: true, 
      user: {
        ...userInfo,
        avatarUrl: userInfo.avatarUrl || '/images/default-avatar.svg'
      },
      message: 'Login successful' 
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return json({ error: 'Login failed' }, { status: 500 });
  }
};
