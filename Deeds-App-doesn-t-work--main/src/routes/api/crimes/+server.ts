import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { crimes, criminals, statutes } from '$lib/server/db/schema';
import { eq, like, sql } from 'drizzle-orm';

export async function GET({ url }) {
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const searchTerm = url.searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    let query = db.select({
        crime: crimes,
        criminal: criminals,
        statute: statutes
    })
    .from(crimes)
    .innerJoin(criminals, eq(crimes.criminalId, criminals.id))
    .innerJoin(statutes, eq(crimes.statuteId, statutes.id))
    .$dynamic();

    let countQuery = db.select({ count: sql`count(*)` })
    .from(crimes)
    .innerJoin(criminals, eq(crimes.criminalId, criminals.id))
    .innerJoin(statutes, eq(crimes.statuteId, statutes.id))
    .$dynamic();

    if (searchTerm) {
        const searchPattern = `%${searchTerm.toLowerCase()}%`;
        query = query.where(
            sql`${crimes.name} ILIKE ${searchPattern} OR ${crimes.description} ILIKE ${searchPattern} OR ${criminals.name} ILIKE ${searchPattern} OR ${statutes.code} ILIKE ${searchPattern} OR ${statutes.title} ILIKE ${searchPattern}`
        );
        countQuery = countQuery.where(
            sql`${crimes.name} ILIKE ${searchPattern} OR ${crimes.description} ILIKE ${searchPattern} OR ${criminals.name} ILIKE ${searchPattern} OR ${statutes.code} ILIKE ${searchPattern} OR ${statutes.title} ILIKE ${searchPattern}`
        );
    }

    const fetchedCrimes = await query.limit(limit).offset(offset);
    const totalCrimesResult = await countQuery;
    const totalCrimes = totalCrimesResult[0].count;

    // Flatten the structure for easier consumption in Svelte component
    const crimesWithDetails = fetchedCrimes.map(row => ({
        ...row.crime,
        criminal: row.criminal,
        statute: row.statute
    }));

    return json({ crimes: crimesWithDetails, totalCrimes });
}

export async function POST({ request }) {
    const { name, description, statuteId, criminalId } = await request.json();

    if (!name || !statuteId || !criminalId) {
        return json({ message: 'Name, statute ID, and criminal ID are required' }, { status: 400 });
    }

    try {
        const newCrime = await db.insert(crimes).values({
            name,
            description,
            statuteId: parseInt(statuteId),
            criminalId: parseInt(criminalId)
        }).returning();
        return json(newCrime[0], { status: 201 });
    } catch (error) {
        console.error('Error adding crime:', error);
        return json({ message: 'Failed to add crime' }, { status: 500 });
    }
}