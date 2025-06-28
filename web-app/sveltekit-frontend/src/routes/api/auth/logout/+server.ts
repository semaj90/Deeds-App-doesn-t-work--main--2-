import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies }) => {
  try {
    // Clear the session cookie
    cookies.delete('session', { path: '/' });
    
    return json({ 
      success: true, 
      message: 'Logout successful' 
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    return json({ error: 'Logout failed' }, { status: 500 });
  }
};
