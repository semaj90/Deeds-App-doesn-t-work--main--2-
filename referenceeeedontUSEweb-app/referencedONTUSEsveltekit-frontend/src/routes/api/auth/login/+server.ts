import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return json({ error: 'Email and password are required' }, { status: 400 });
    }
    
    // Mock authentication - replace with actual auth logic
    if (email === 'admin@prosecutor.gov' && password === 'admin123') {
      const user = {
        id: '1',
        email: 'admin@prosecutor.gov',
        name: 'Admin User',
        role: 'prosecutor',
        department: 'District Attorney Office'
      };
      
      return json({ 
        success: true, 
        user,
        message: 'Login successful' 
      });
    } else if (email === 'demo@prosecutor.gov' && password === 'demo123') {
      const user = {
        id: '2',
        email: 'demo@prosecutor.gov',
        name: 'Demo User',
        role: 'prosecutor',
        department: 'District Attorney Office'
      };
      
      return json({ 
        success: true, 
        user,
        message: 'Login successful' 
      });
    } else {
      return json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
  } catch (error) {
    console.error('Login error:', error);
    return json({ error: 'Login failed' }, { status: 500 });
  }
};
