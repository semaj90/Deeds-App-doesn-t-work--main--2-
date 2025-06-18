import { deleteSessionTokenCookie, invalidateSession } from '$lib/server/session';
import { redirect, type Actions } from '@sveltejs/kit';

export const actions: Actions = {
  default: async (event) => {
    if (!event.locals.session) {
      throw redirect(302, '/login');
    }
    
    // Invalidate the session in the database
    await invalidateSession(event.locals.session.id);
    
    // Delete the session cookie
    deleteSessionTokenCookie(event);
    
    // Redirect to login page
    throw redirect(302, '/login');
  }
};
    
    throw redirect(302, '/login');
  }
};