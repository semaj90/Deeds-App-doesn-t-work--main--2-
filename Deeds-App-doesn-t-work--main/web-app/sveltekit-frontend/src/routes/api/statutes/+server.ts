import { json } from '@sveltejs/kit';
import { db, statutes } from '$lib/server/db';
import { sql, ilike } from 'drizzle-orm';
import { cache, invalidateCacheByTags } from '$lib/server/cache/cache';

export async function GET({ url }) {
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const searchTerm = url.searchParams.get('search') || '';

    // Create cache key based on all query parameters
    const cacheKey = `statutes:list:${page}:${limit}:${searchTerm}`;
    
    // Try to get from cache first
    const cached = cache.get(cacheKey);
    if (cached) {
        return json(cached);
    }

    const offset = (page - 1) * limit;

    let fetchedStatutes, totalStatutesResult;
    if (searchTerm) {
        const searchPattern = `%${searchTerm.toLowerCase()}%`;
        fetchedStatutes = await db.query.statutes.findMany({
            where: sql`${statutes.title} ILIKE ${searchPattern} OR ${statutes.description} ILIKE ${searchPattern} OR ${statutes.fullText} ILIKE ${searchPattern}`,
            .limit(limit).offset(offset);
        totalStatutesResult = await db.select({ count: sql<number>`count(*)` }).from(statutes)
            .where(ilike(statutes.title, searchPattern) || ilike(statutes.description, searchPattern) || ilike(statutes.fullText, searchPattern));
    } else {
        fetchedStatutes = await db.query.statutes.findMany({ limit, offset });
        totalStatutesResult = await db.select({ count: sql`count(*)` }).from(statutes);
    }
    const totalStatutes = totalStatutesResult[0].count;

    const result = { statutes: fetchedStatutes, totalStatutes };
    
    // Cache the result with a 10 min TTL (600000 ms)
    cache.set(cacheKey, result, 600000);

    return json(result);
}

export async function POST({ request }) {
    const { title, code, description, fullText, category, severity, minPenalty, maxPenalty, jurisdiction, effectiveDate } = await request.json();

    if (!title || !code) {
        return json({ message: 'Title and code are required' }, { status: 400 });
    }

    try {
        const newStatute = await db.insert(statutes).values({ // ID is auto-generated UUID
            title,
            code,
            description,
            fullText,
            category,
            severity,
            minPenalty,
            maxPenalty,
            jurisdiction,
            effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined
        }).returning();
        
        // Invalidate cache after successful insertion
        invalidateCacheByTags(['statutes', 'statutes:list']);
        
        return json(newStatute[0], { status: 201 });
    } catch (error) {
        console.error('Error adding statute:', error);
        return json({ message: 'Failed to add statute' }, { status: 500 });
    }
}