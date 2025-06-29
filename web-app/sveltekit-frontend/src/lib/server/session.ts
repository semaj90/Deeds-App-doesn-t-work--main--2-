import type { RequestEvent } from '@sveltejs/kit';
import { verifyToken, signToken } from './auth';
import { getUserById } from './db/queries';

export interface Session {
    id: string;
    userId: string;
    expiresAt: Date;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role?: string;
}

// Simple in-memory session store (for development - use Redis/database for production)
const sessions = new Map<string, Session>();

export function createSession(userId: string): Session {
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    const session: Session = {
        id: sessionId,
        userId,
        expiresAt
    };
    
    sessions.set(sessionId, session);
    return session;
}

export async function validateSessionToken(token: string): Promise<{ session: Session | null; user: User | null }> {
    try {
        // First try JWT token validation
        const payload = verifyToken(token);
        if (payload && payload.userId) {
            const user = await getUserById(payload.userId);
            if (user) {
                const session: Session = {
                    id: token,
                    userId: user.id,
                    expiresAt: new Date(payload.exp * 1000)
                };
                return { session, user };
            }
        }
        
        // Fallback to session store
        const session = sessions.get(token);
        if (!session || session.expiresAt < new Date()) {
            if (session) {
                sessions.delete(token);
            }
            return { session: null, user: null };
        }
        
        const user = await getUserById(session.userId);
        if (!user) {
            sessions.delete(token);
            return { session: null, user: null };
        }
        
        return { session, user };
    } catch (error) {
        console.error('Session validation error:', error);
        return { session: null, user: null };
    }
}

export function invalidateSession(sessionId: string): void {
    sessions.delete(sessionId);
}

export function setSessionTokenCookie(
    event: RequestEvent,
    token: string,
    expiresAt: Date
): void {
    event.cookies.set('session', token, {
        path: '/',
        expires: expiresAt,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
}

export function deleteSessionTokenCookie(event: RequestEvent): void {
    event.cookies.delete('session', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
}

export function generateSessionToken(userId: string): string {
    return signToken({ userId });
}
