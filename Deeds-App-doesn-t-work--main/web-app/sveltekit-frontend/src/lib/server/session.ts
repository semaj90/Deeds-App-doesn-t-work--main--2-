import { randomBytes } from 'crypto';
import { db } from './db/index.js';
import { sessions, users } from './db/schema.js';
import { eq } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';

const SESSION_COOKIE_NAME = 'session';

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

export async function createSession(token: string, userId: string) {
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days
  
  const [session] = await db.insert(sessions).values({
    id: token,
    userId,
    expiresAt: expiresAt.toISOString()
  }).returning();
  
  return session;
}

export async function validateSessionToken(token: string) {
  try {
    const [result] = await db
      .select({
        session: sessions,
        user: users
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.id, token))
      .limit(1);

    if (!result) {
      return { session: null, user: null };
    }

    const { session, user } = result;

    const expiresAtTime = new Date(session.expiresAt).getTime();
    if (Date.now() >= expiresAtTime) {
      await db.delete(sessions).where(eq(sessions.id, token));
      return { session: null, user: null };
    }

    // Refresh session if it's close to expiring
    if (Date.now() >= expiresAtTime - 1000 * 60 * 60 * 24 * 15) {
      const newExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
      session.expiresAt = newExpiresAt.toISOString();
      await db.update(sessions)
        .set({ expiresAt: session.expiresAt })
        .where(eq(sessions.id, token));
    }

    return { session, user };
  } catch (error) {
    console.error('Session validation error:', error);
    return { session: null, user: null };
  }
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
  event.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
    secure: process.env.NODE_ENV === 'production'
  });
}

export function deleteSessionTokenCookie(event: RequestEvent): void {
  event.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  });
}

export async function invalidateSession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, token));
}
