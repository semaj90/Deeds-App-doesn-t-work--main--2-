import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { criminals } from '$lib/server/db/schema';
import { eq, like, sql } from 'drizzle-orm';

export async function GET({ url }) {
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const searchTerm = url.searchParams.get('search') || '';
    const filterStatus = url.searchParams.get('status') || '';
    const filterThreatLevel = url.searchParams.get('threat') || '';

    const offset = (page - 1) * limit;

    let query = db.select().from(criminals).$dynamic();
    let countQuery = db.select({ count: sql`count(*)` }).from(criminals).$dynamic();

    if (searchTerm) {
        console.log(`Search Term: ${searchTerm}`);
        const searchPattern = `%${searchTerm.toLowerCase()}%`;
        console.log(`Search Pattern: ${searchPattern}`);
        query = query.where(
            sql`${criminals.name} ILIKE ${searchPattern}`
        );
        countQuery = countQuery.where(
            sql`${criminals.name} ILIKE ${searchPattern}`
        );
    }


    if (filterThreatLevel) {
        const threatLevelNum = parseInt(filterThreatLevel);
        if (!isNaN(threatLevelNum)) {
            query = query.where(eq(criminals.threatLevel, threatLevelNum));
            countQuery = countQuery.where(eq(criminals.threatLevel, threatLevelNum));
        }
    }

    const fetchedCriminals = await query.limit(limit).offset(offset);
    const totalCriminalsResult = await countQuery;
    const totalCriminals = totalCriminalsResult[0].count;

    return json({ criminals: fetchedCriminals, totalCriminals });
}

export async function POST({ request }) {
    const {
        name,
        aliases,
        priors,
        convictions,
        threatLevel
    } = await request.json();

    try {
        const newCriminal = await db.insert(criminals).values({
            name,
            aliases: aliases || [],
            priors: priors || [],
            // convictions field doesn't exist in schema, use priors instead
            threatLevel: threatLevel ? parseInt(threatLevel) : 1
        }).returning();
        return json(newCriminal[0], { status: 201 });
    } catch (error) {
        console.error('Error adding criminal:', error);
        return json({ message: 'Failed to add criminal' }, { status: 500 });
    }
}