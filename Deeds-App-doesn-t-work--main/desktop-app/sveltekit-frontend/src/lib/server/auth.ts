// --- Modern Auth helpers for SvelteKit with Sessions + JWT hybrid ---
// This combines session-based auth (primary) with JWT tokens (backup/API)

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { db } from './db/index.js';
import { users } from './db/schema.js';
import { eq } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';
import { 
  generateSessionToken, 
  createSession, 
  setSessionTokenCookie,
  deleteSessionTokenCookie 
} from './session.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret';
const JWT_EXPIRATION = 7 * 24 * 60 * 60; // 7 days in seconds

// Hash a password (Node.js, bcrypt)
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

// Compare a password to a hash (Node.js, bcrypt)
export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Verify password (alias for compatibility)
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Sign a JWT (Node.js, jsonwebtoken) - for API use
export function signToken(payload: { userId: number, role?: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: `${JWT_EXPIRATION}s` });
}

// Sign JWT (alias for compatibility)
export function signJWT(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: `${JWT_EXPIRATION}s` });
}

// Verify a JWT and fetch user data - for API use
export async function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    
    // Fetch full user data from database
    const user = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
    
    if (user.length === 0) {
      return null;
    }
    
    return user[0];
  } catch {
    return null;
  }
}

// Verify JWT (alias for compatibility)
export function verifyJWT(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Generate secure token
export function generateSecureToken(): string {
  return crypto.randomUUID();
}

// Create a new user session (primary method for web auth)
export async function createUserSession(event: RequestEvent, userId: number) {
  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, userId);
  setSessionTokenCookie(event, sessionToken, session.expiresAt);
  return session;
}

// Logout user by clearing session
export async function logoutUser(event: RequestEvent) {
  deleteSessionTokenCookie(event);
}

// Set JWT cookie (for API compatibility)
export function setJWTCookie(event: RequestEvent, token: string): void {
  event.cookies.set('jwt', token, {
    httpOnly: true,
    sameSite: 'lax',
    expires: new Date(Date.now() + JWT_EXPIRATION * 1000),
    path: '/',
    secure: process.env.NODE_ENV === 'production'
  });
}

// Delete JWT cookie
export function deleteJWTCookie(event: RequestEvent): void {
  event.cookies.set('jwt', '', {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  });
}

// Legacy: Set authentication cookie (deprecated - use createUserSession instead)
export function setAuthCookie(event: RequestEvent, token: string): void {
  console.warn('setAuthCookie is deprecated, use createUserSession instead');
  setJWTCookie(event, token);
}

// Legacy: Delete authentication cookie (deprecated - use logoutUser instead)  
export function deleteAuthCookie(event: RequestEvent): void {
  console.warn('deleteAuthCookie is deprecated, use logoutUser instead');
  deleteJWTCookie(event);
}

// Sign out function (alias for logoutUser)
export async function signOut(event: RequestEvent) {
  return await logoutUser(event);
}

// Handle auth function for API routes
export async function handleAuth(event: RequestEvent) {
  const { request } = event;
  
  if (request.method === 'POST') {
    // Handle login/register
    const formData = await request.formData();
    const action = formData.get('action') as string;
    
    if (action === 'login') {
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      
      if (!email || !password) {
        return new Response('Missing email or password', { status: 400 });
      }
      
      // Find user by email
      const user = await db.query.users.findFirst({
        where: eq(users.email, email)
      });
      
      if (user && user.hashedPassword && await comparePasswords(password, user.hashedPassword)) {
        await createUserSession(event, user.id);
        return new Response('Login successful', { status: 200 });
      } else {
        return new Response('Invalid credentials', { status: 401 });
      }
    }
    
    if (action === 'logout') {
      await logoutUser(event);
      return new Response('Logout successful', { status: 200 });
    }
  }
  
  return new Response('Method not allowed', { status: 405 });
}