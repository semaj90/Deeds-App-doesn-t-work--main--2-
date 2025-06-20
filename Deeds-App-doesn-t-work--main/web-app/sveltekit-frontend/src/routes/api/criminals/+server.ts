import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { criminals } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { cache, invalidateCacheByTags } from '$lib/server/cache/cache';

export async function GET({ url }) {
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const searchTerm = url.searchParams.get('search') || '';
    const filterStatus = url.searchParams.get('status') || '';
    const filterThreatLevel = url.searchParams.get('threat') || '';

    const cacheKey = `criminals:list:${page}:${limit}:${searchTerm}:${filterStatus}:${filterThreatLevel}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        return json(cached);
    }
    const offset = (page - 1) * limit;
    let query = db.select().from(criminals).$dynamic();
    let countQuery = db.select({ count: sql`count(*)` }).from(criminals).$dynamic();
    if (searchTerm) {
        const searchPattern = `%${searchTerm.toLowerCase()}%`;
        query = query.where(sql`(lower(${criminals.firstName}) LIKE ${searchPattern} OR lower(${criminals.lastName}) LIKE ${searchPattern})`);
        countQuery = countQuery.where(sql`(lower(${criminals.firstName}) LIKE ${searchPattern} OR lower(${criminals.lastName}) LIKE ${searchPattern})`);
    }
    if (filterThreatLevel) {
        query = query.where(eq(criminals.threatLevel, filterThreatLevel));
        countQuery = countQuery.where(eq(criminals.threatLevel, filterThreatLevel));
    }
    if (filterStatus) {
        query = query.where(eq(criminals.status, filterStatus));
        countQuery = countQuery.where(eq(criminals.status, filterStatus));
    }
    const fetchedCriminals = await query.limit(limit).offset(offset);
    const totalCriminalsResult = await countQuery;
    const totalCriminals = totalCriminalsResult[0].count;
    const result = { criminals: fetchedCriminals, totalCriminals };
    cache.set(cacheKey, result, 300000, ['criminals', 'criminals:list']);
    return json(result);
}

export async function POST({ request }) {
    const body = await request.json();
    const {
        firstName,
        lastName,
        middleName,
        aliases,
        dateOfBirth,
        address,
        phone,
        photoUrl,
        threatLevel,
        status,
        priors,
        convictions,
        notes,
        aiSummary,
        aiTags,
        aiAnalysis,
        createdBy
    } = body;
    try {
        const newCriminal = await db.insert(criminals).values({
            id: crypto.randomUUID(),
            firstName,
            lastName,
            middleName,
            aliases: aliases || [],
            dateOfBirth,
            address,
            phone,
            photoUrl,
            threatLevel: threatLevel || 'low',
            status: status || 'active',
            priors: priors || [],
            convictions: convictions || [],
            notes,
            aiSummary,
            aiTags: aiTags || [],
            aiAnalysis: aiAnalysis || {},
            createdBy,
            createdAt: new Date(),
            updatedAt: new Date()
        }).returning();
        invalidateCacheByTags(['criminals', 'criminals:list']);
        return json(newCriminal[0], { status: 201 });
    } catch (error) {
        console.error('Error adding criminal:', error);
        return json({ message: 'Failed to add criminal' }, { status: 500 });
    }
}