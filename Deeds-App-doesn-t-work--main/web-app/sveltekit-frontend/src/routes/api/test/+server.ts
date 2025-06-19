import { json } from '@sveltejs/kit';

export async function GET() {
    return json({ 
        message: 'API is working!', 
        timestamp: new Date().toISOString() 
    });
}
