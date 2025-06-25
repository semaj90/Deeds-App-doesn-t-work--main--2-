import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { statutes } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';

export async function GET({ url }) {
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const searchTerm = url.searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    let query = db.select().from(statutes).$dynamic();
    let countQuery = db.select({ count: sql`count(*)` }).from(statutes).$dynamic();

    if (searchTerm) {
        const searchPattern = `%${searchTerm.toLowerCase()}%`;
        query = query.where(
            sql`${statutes.title} ILIKE ${searchPattern} OR ${statutes.description} ILIKE ${searchPattern} OR ${statutes.code} ILIKE ${searchPattern}`
        );
        countQuery = countQuery.where(
            sql`${statutes.title} ILIKE ${searchPattern} OR ${statutes.description} ILIKE ${searchPattern} OR ${statutes.code} ILIKE ${searchPattern}`
        );
    }

    const fetchedStatutes = await query.limit(limit).offset(offset);
    const totalStatutesResult = await countQuery;
    const totalStatutes = totalStatutesResult[0].count;

    return json({ statutes: fetchedStatutes, totalStatutes });
}

export async function POST({ request }) {
    const { title, description, code } = await request.json();

    if (!title || !code) {
        return json({ message: 'Title and code are required' }, { status: 400 });
    }

    try {
        const newStatute = await db.insert(statutes).values({
            title,
            description,
            code,
            category: 'general' // Provide default category
        }).returning();
        return json(newStatute[0], { status: 201 });
    } catch (error) {
        console.error('Error adding statute:', error);
        return json({ message: 'Failed to add statute' }, { status: 500 });
    }
}