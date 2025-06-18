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
import { env } from './env';

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, env.BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export function signJWT(payload: object): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: `${env.JWT_EXPIRATION_SECONDS}s`,
  });
}

export function verifyJWT(token: string): any {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function generateSecureToken(): string {
  return crypto.randomUUID();
}

export async function createUserSession(event: RequestEvent, userId: string) {
  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, userId);
  setSessionTokenCookie(event, sessionToken, session.expiresAt);
  return session;
}

export async function logoutUser(event: RequestEvent) {
  deleteSessionTokenCookie(event);
}

export function setJWTCookie(event: RequestEvent, token: string): void {
  event.cookies.set('jwt', token, {
    httpOnly: true,
    sameSite: 'lax',
    expires: new Date(Date.now() + env.JWT_EXPIRATION_SECONDS * 1000),
    path: '/',
    secure: process.env.NODE_ENV === 'production'
  });
}

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

// --- Tauri/Rust integration notes ---
// To port this logic to Rust (for Tauri backend):
// - Use the 'jsonwebtoken' crate for JWT sign/verify in Rust.
// - Use the 'bcrypt' crate for password hashing/comparison in Rust.
// - Store JWT in Tauri's secure storage or filesystem for offline mode.
// - Expose Rust commands to SvelteKit frontend via Tauri API for login/register.