import { randomBytes } from 'crypto';
import { db } from './db';
import { sessions, users } from './db/schema';
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
    expiresAt
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

    if (Date.now() >= session.expiresAt.getTime()) {
      await db.delete(sessions).where(eq(sessions.id, token));
      return { session: null, user: null };
    }

    // Refresh session if it's close to expiring
    if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
      session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
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
