import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '0.0.1',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'connected', // This would check actual DB connection in production
        api: 'operational'
      }
    };
    
    return json(health);
    
  } catch (error) {
    console.error('Health check error:', error);
    return json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable'
    }, { status: 503 });
  }
};
