import { json, redirect } from '@sveltejs/kit';
import { invalidateSession, deleteSessionTokenCookie } from '$lib/server/session';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST(event: RequestEvent) {
  const sessionToken = event.cookies.get('session');
  
  if (sessionToken) {
    // Invalidate the session in the database
    await invalidateSession(sessionToken);
  }
  
  // Clear the session cookie
  deleteSessionTokenCookie(event);
  
  return json({ success: true, message: 'Logged out successfully' });
}

export async function GET(event: RequestEvent) {
  const sessionToken = event.cookies.get('session');
  
  if (sessionToken) {
    // Invalidate the session in the database
    await invalidateSession(sessionToken);
  }
  
  // Clear the session cookie
  deleteSessionTokenCookie(event);
  
  // Redirect to login page
  throw redirect(302, '/login');
}
