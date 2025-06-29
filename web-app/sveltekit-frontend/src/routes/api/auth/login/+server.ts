import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { verifyPassword, hashPassword } from '$lib/server/authUtils';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const { email, password } = await request.json();
    console.log('[Login API] Attempting login for:', email);
    
    if (!email || !password) {
      return json({ error: 'Email and password are required' }, { status: 400 });
    }
    
    // Demo user credentials for automatic creation
    const demoUsers = [
      { email: 'admin@example.com', password: 'admin123', name: 'Demo Admin', role: 'admin' },
      { email: 'user@example.com', password: 'user123', name: 'Demo User', role: 'prosecutor' }
    ];
    
    // Find user in database
    let user = await db.query.users.findFirst({
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
    
    // If user doesn't exist and it's a demo user, create them
    if (!user) {
      const demoUser = demoUsers.find(du => du.email === email);
      if (demoUser) {
        console.log('[Login API] Creating demo user:', email);
        const hashedPassword = await hashPassword(demoUser.password);
        
        const [newUser] = await db.insert(users).values({
          email: demoUser.email,
          hashedPassword,
          name: demoUser.name,
          firstName: demoUser.name.split(' ')[0] || '',
          lastName: demoUser.name.split(' ').slice(1).join(' ') || '',
          role: demoUser.role
        }).returning();
        
        user = {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          hashedPassword: newUser.hashedPassword,
          avatarUrl: null
        };
        console.log('[Login API] Demo user created:', user.id);
      }
    }
    
    if (!user || !user.hashedPassword) {
      return json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(password, user.hashedPassword);
    
    if (!isValidPassword) {
      return json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    console.log('[Login API] Login successful for:', user.email);
    
    // Set session cookie (for now, use user ID as session token)
    cookies.set('session', user.id, {
      path: '/',
      httpOnly: true,
      secure: true, // Set to true in production with HTTPS
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
