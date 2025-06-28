import type { Handle } from '@sveltejs/kit';
import { validateSessionToken } from './lib/server/session.js';

const SESSION_COOKIE_NAME = 'session';

export const handle: Handle = async ({ event, resolve }) => {
  const sessionToken = event.cookies.get(SESSION_COOKIE_NAME);
  
  if (sessionToken) {
    const { session, user } = await validateSessionToken(sessionToken);
    if (session && user) {
      event.locals.session = session;
      event.locals.user = user;
    }
  }

  return resolve(event);
};
