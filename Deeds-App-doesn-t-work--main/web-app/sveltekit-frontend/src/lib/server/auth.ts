import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export function signToken(payload: any): string {
  return jwt.sign(payload, env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, env.JWT_SECRET || 'your-secret-key');
  } catch {
    return null;
  }
}

export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export function signOut(): void {
  // This function is handled by individual routes
  // Implementation depends on the specific signout strategy
}

export function handleAuth() {
  // Placeholder for auth handler
  return {
    GET: async () => new Response('Auth endpoint'),
    POST: async () => new Response('Auth endpoint')
  };
}
