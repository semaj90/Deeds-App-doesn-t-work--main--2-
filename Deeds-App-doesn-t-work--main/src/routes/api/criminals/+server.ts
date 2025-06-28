import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { criminals } from '$lib/server/db/unified-schema';
import { eq, like, sql, count } from 'drizzle-orm';

export async function GET({ url }) {
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const searchTerm = url.searchParams.get('search') || '';
    const filterStatus = url.searchParams.get('status') || '';
    const filterThreatLevel = url.searchParams.get('threat') || '';

    const offset = (page - 1) * limit;

    let query = db.select().from(criminals).$dynamic();
    let countQuery = db.select({ count: count() }).from(criminals).$dynamic();

    if (searchTerm) {
        console.log(`Search Term: ${searchTerm}`);
        const searchPattern = `%${searchTerm.toLowerCase()}%`;
        console.log(`Search Pattern: ${searchPattern}`);
        query = query.where(
            sql`(${criminals.firstName} ILIKE ${searchPattern} OR ${criminals.lastName} ILIKE ${searchPattern})`
        );
        countQuery = countQuery.where(
            sql`(${criminals.firstName} ILIKE ${searchPattern} OR ${criminals.lastName} ILIKE ${searchPattern})`
        );
    }


    if (filterThreatLevel) {
        query = query.where(eq(criminals.threatLevel, filterThreatLevel));
        countQuery = countQuery.where(eq(criminals.threatLevel, filterThreatLevel));
    }

    const fetchedCriminals = await query.limit(limit).offset(offset);
    const totalCriminalsResult = await countQuery;
    const totalCriminals = Number(totalCriminalsResult[0].count);

    return json({ criminals: fetchedCriminals, totalCriminals });
}

export async function POST({ request }) {
    const {
        firstName,
        lastName,
        middleName,
        aliases,
        dateOfBirth,
        address,
        email,
        threatLevel,
        status
    } = await request.json();

    try {
        const newCriminal = await db.insert(criminals).values({
            firstName,
            lastName,
            middleName: middleName || null,
            aliases: aliases || [],
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            address: address || null,
            email: email || null,
            threatLevel: threatLevel || 'low',
            status: status || 'active'
        }).returning();
        return json(newCriminal[0], { status: 201 });
    } catch (error) {
        console.error('Error adding criminal:', error);
        return json({ message: 'Failed to add criminal' }, { status: 500 });
    }
}