import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
  try {
    // Mock data for now - replace with actual database query
    const cases = [
      {
        id: '1',
        title: 'Sample Case #1',
        status: 'active',
        priority: 'high',
        createdAt: new Date().toISOString(),
        description: 'A sample case for testing purposes'
      },
      {
        id: '2', 
        title: 'Sample Case #2',
        status: 'pending',
        priority: 'medium',
        createdAt: new Date().toISOString(),
        description: 'Another sample case for testing'
      }
    ];

    return json(cases);
  } catch (error) {
    console.error('Error fetching cases:', error);
    return json({ error: 'Failed to fetch cases' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    
    // Mock response - replace with actual database insertion
    const newCase = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    return json(newCase, { status: 201 });
  } catch (error) {
    console.error('Error creating case:', error);
    return json({ error: 'Failed to create case' }, { status: 500 });
  }
};
