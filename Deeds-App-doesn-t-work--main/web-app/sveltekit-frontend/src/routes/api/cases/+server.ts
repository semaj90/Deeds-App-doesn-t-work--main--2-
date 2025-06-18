import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { cases } from '$lib/server/db/schema';
import { eq, and, or, ilike } from 'drizzle-orm';

// GET /api/cases - List all cases for the logged-in user, with optional search
export async function GET({ url, locals }) {    try {
        const userId = locals.user?.id;
        if (!userId) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }
        const search = url.searchParams.get('search')?.toLowerCase();
        let userCases;
        if (search) {
            userCases = await db.select().from(cases).where(
                and(
                    eq(cases.createdBy, userId),
                    or(
                        ilike(cases.title, `%${search}%`),
                        ilike(cases.description, `%${search}%`)
                    )
                )
            );
        } else {
            userCases = await db.select().from(cases).where(eq(cases.createdBy, userId));
        }
        return json(userCases);
    } catch (error) {
        console.error('Error fetching cases:', error);
        return json({ error: 'Failed to fetch cases', details: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
    }
}

// POST /api/cases - Create a new case
export async function POST({ request, locals }) {
    const { 
        title, 
        description, 
        priority, 
        category, 
        jurisdiction, 
        incidentDate, 
        location,
        dangerScore, 
        status, 
        aiSummary 
    } = await request.json();
    
    const userId = locals.user?.id;
    if (!userId || !title || !description) {
        return json({ message: 'Title, description, and user ID are required' }, { status: 400 });
    }
    
    try {
        const id = crypto.randomUUID();
        const newCase = await db.insert(cases).values({
            id,
            title,
            description,
            priority: priority || 'medium',
            category: category || null,
            jurisdiction: jurisdiction || null,
            incidentDate: incidentDate ? new Date(incidentDate) : null,
            location: location || null,
            dangerScore: dangerScore || 0,
            status: status || 'open',
            aiSummary: aiSummary || null,
            createdBy: userId,
            leadProsecutor: userId
        }).returning();
        
        return json(newCase[0], { status: 201 });
    } catch (error) {
        console.error('Error adding case:', error);
        return json({ message: 'Failed to add case', details: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
    }
}
