import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { lawParagraphs, cases } from '$lib/server/db/schema';
import { cache, invalidateCacheByTags } from '$lib/server/cache/cache';
import { sql, inArray } from 'drizzle-orm';

export async function GET() {
    const cacheKey = 'law-paragraphs:all';
    
    // Try to get from cache first
    const cached = cache.get(cacheKey);
    if (cached) {
        return json(cached);
    }

    try {
        // Fetch all law paragraphs with advanced fields
        const allLawParagraphs = await db.select().from(lawParagraphs);
        
        // Safe JSON parsing helper
        const getArray = (val: any): any[] => {
            if (!val) return [];
            if (Array.isArray(val)) return val;
            if (typeof val === 'string') {
                try {
                    const parsed = JSON.parse(val);
                    return Array.isArray(parsed) ? parsed : [];
                } catch {
                    return [];
                }
            }
            return [];
        };

        // Collect all case IDs from linkedCaseIds
        const caseIds = Array.from(new Set(
            allLawParagraphs.flatMap(lp => getArray(lp.linkedCaseIds))
                           .filter(id => typeof id === 'string' && id.length > 0)
        ));

        // Fetch related cases if we have valid case IDs
        let casesMap: { [key: string]: any } = {};
        if (caseIds.length > 0) {
            const relatedCases = await db.select().from(cases).where(inArray(cases.id, caseIds));
            casesMap = Object.fromEntries(relatedCases.map(c => [c.id, c]));
        }

        // Transform the data for consistent JSON response
        const result = allLawParagraphs.map(lp => ({
            ...lp,
            tags: getArray(lp.tags),
            linkedCaseIds: getArray(lp.linkedCaseIds),
            crimeSuggestions: getArray(lp.crimeSuggestions),
            lawCases: getArray(lp.linkedCaseIds)
                .map((id: string) => casesMap[id])
                .filter(Boolean),
        }));
        
        // Cache the result with tags for invalidation (10 minutes TTL)
        cache.set(cacheKey, result, 600000, ['law-paragraphs']);
        
        return json(result);
    } catch (error) {
        console.error('Error fetching law paragraphs:', error);
        return json({ error: 'Failed to fetch law paragraphs' }, { status: 500 });
    }
}

export async function POST({ request }: { request: Request }) {
    try {
        const body = await request.json();
        const { 
            statuteId, 
            paragraphText, 
            anchorId, 
            paragraphNumber, 
            tags, 
            aiSummary, 
            linkedCaseIds, 
            crimeSuggestions, 
            content 
        } = body;

        // Validation
        if (!statuteId || !(paragraphText || content)) {
            return json({ 
                error: 'statuteId and paragraphText/content are required' 
            }, { status: 400 });
        }

        // Ensure JSON fields are always stored as strings
        const safeStringify = (val: any): string => {
            if (!val) return '[]';
            if (typeof val === 'string') return val;
            return JSON.stringify(Array.isArray(val) ? val : []);
        };

        const newLawParagraph = await db.insert(lawParagraphs).values({
            id: crypto.randomUUID(),
            statuteId,
            paragraphNumber: paragraphNumber || '1',
            content: content || paragraphText,
            paragraphText: paragraphText || content,
            anchorId,
            tags: safeStringify(tags),
            aiSummary: aiSummary || '',
            linkedCaseIds: safeStringify(linkedCaseIds),
            crimeSuggestions: safeStringify(crimeSuggestions),
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();

        // Invalidate cache after successful insertion
        invalidateCacheByTags(['law-paragraphs', 'statutes']);

        return json(newLawParagraph[0], { status: 201 });
    } catch (error) {
        console.error('Error creating law paragraph:', error);
        return json({ 
            error: 'Failed to create law paragraph',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}