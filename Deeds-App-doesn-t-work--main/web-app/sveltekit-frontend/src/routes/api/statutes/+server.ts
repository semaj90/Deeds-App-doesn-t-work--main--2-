import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { statutes } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';
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

    let query = db.select().from(statutes).$dynamic();
    let countQuery = db.select({ count: sql`count(*)` }).from(statutes).$dynamic();

    if (searchTerm) {
        const searchPattern = `%${searchTerm.toLowerCase()}%`;
        query = query.where(
            sql`${statutes.title} LIKE ${searchPattern} OR ${statutes.content} LIKE ${searchPattern}`
        );
        countQuery = countQuery.where(
            sql`${statutes.title} LIKE ${searchPattern} OR ${statutes.content} LIKE ${searchPattern}`
        );
    }

    const fetchedStatutes = await query.limit(limit).offset(offset);
    const totalStatutesResult = await countQuery;
    const totalStatutes = totalStatutesResult[0].count;

    const result = { statutes: fetchedStatutes, totalStatutes };
    
    // Cache the result with tags for invalidation
    cache.set(cacheKey, result, {
        ttl: 600000, // 10 minutes (statutes change less frequently)
        tags: ['statutes', 'statutes:list']
    });

    return json(result);
}

export async function POST({ request }) {
    const { title, content } = await request.json();

    if (!title) {
        return json({ message: 'Title is required' }, { status: 400 });
    }

    try {
        const newStatute = await db.insert(statutes).values({
            id: crypto.randomUUID(),
            title,
            content
        }).returning();
        
        // Invalidate cache after successful insertion
        invalidateCacheByTags(['statutes', 'statutes:list']);
        
        return json(newStatute[0], { status: 201 });
    } catch (error) {
        console.error('Error adding statute:', error);
        return json({ message: 'Failed to add statute' }, { status: 500 });
    }
}