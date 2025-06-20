import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { cases, crimes, criminals, caseLawLinks, lawParagraphs, caseActivities } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { withCache, cacheKeys, cacheTags, invalidateCacheByTags } from '$lib/server/cache/cache';
import type { RequestHandler } from './$types';
import { predictiveAnalyzer } from '$lib/nlp/analyzer';

// GET /api/cases - List all cases for the logged-in user, with optional search and tag filter
export const GET: RequestHandler = async ({ url, locals }) => {
  const userId = locals.user?.id;
  if (!userId) return json({ error: 'Unauthorized' }, { status: 401 });

  const search = url.searchParams.get('search');
  const status = url.searchParams.get('status');
  const tagsParam = url.searchParams.get('tags'); // comma-separated tags
  const tags = tagsParam ? tagsParam.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [];

  // Generate cache key based on parameters
  const cacheKey = [userId, search, status, tags.sort().join(',')].join(':');

  try {
    return json(await withCache(
      cacheKey,
      async () => {
        const conditions = [eq(cases.createdBy, userId)];
        if (search) {
          const searchPattern = `%${search.toLowerCase()}%`;
          conditions.push(
            sql`(lower(${cases.title}) LIKE ${searchPattern} OR lower(${cases.description}) LIKE ${searchPattern})`
          );
        }
        if (status && status !== 'all') {
          conditions.push(eq(cases.status, status));
        }
        if (tags.length > 0) {
          // SQLite JSON1: check if any tag is present in the tags array
          tags.forEach(tag => {
            conditions.push(sql`EXISTS (SELECT 1 FROM json_each(${cases.tags}) WHERE lower(json_each.value) = ${tag})`);
          });
        }
        // Fetch all cases for user
        const caseRows = await db.select().from(cases).where(and(...conditions));
        // For each case, fetch related crimes, criminals, law links, law paragraphs, and activities
        const caseIds = caseRows.map(c => c.id);
        const [crimesRows, lawLinksRows, activitiesRows] = await Promise.all([
          db.select().from(crimes).where(sql`${crimes.caseId} IN (${caseIds.map(id => `'${id}'`).join(',')})`),
          db.select().from(caseLawLinks).where(sql`${caseLawLinks.caseId} IN (${caseIds.map(id => `'${id}'`).join(',')})`),
          db.select().from(caseActivities).where(sql`${caseActivities.caseId} IN (${caseIds.map(id => `'${id}'`).join(',')})`),
        ]);
        // Map criminals and law paragraphs
        const criminalIds = [...new Set(crimesRows.map(cr => cr.criminalId).filter(Boolean))];
        const lawParagraphIds = [...new Set(lawLinksRows.map(l => l.lawParagraphId).filter(Boolean))];
        const [criminalsRows, lawParagraphsRows] = await Promise.all([
          criminalIds.length ? db.select().from(criminals).where(sql`${criminals.id} IN (${criminalIds.map(id => `'${id}'`).join(',')})`) : [],
          lawParagraphIds.length ? db.select().from(lawParagraphs).where(sql`${lawParagraphs.id} IN (${lawParagraphIds.map(id => `'${id}'`).join(',')})`) : [],
        ]);
        // Assemble full case objects
        const casesWithRelations = caseRows.map(c => ({
          ...c,
          crimes: crimesRows.filter(cr => cr.caseId === c.id),
          criminals: criminalsRows.filter(crim => crimesRows.some(cr => cr.caseId === c.id && cr.criminalId === crim.id)),
          lawLinks: lawLinksRows.filter(l => l.caseId === c.id),
          lawParagraphs: lawParagraphsRows.filter(lp => lawLinksRows.some(l => l.caseId === c.id && l.lawParagraphId === lp.id)),
          activities: activitiesRows.filter(a => a.caseId === c.id),
        }));
        return casesWithRelations;
      },
      5 * 60 * 1000, // 5 minutes cache
      [cacheTags.cases, `user:${userId}`]
    ));
  } catch (error) {
    console.error('Failed to fetch cases:', error);
    return json({ error: 'Failed to fetch cases' }, { status: 500 });
  }
};

// POST /api/cases - Create a new case
export const POST: RequestHandler = async ({ request, locals }) => {
  const userId = locals.user?.id;
  if (!userId) return json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    // Auto-generate tags using NLP analyzer
    let tags = body.tags;
    if (!tags || tags.length === 0) {
      const analysis = await predictiveAnalyzer.analyzeCaseDescription(body.description || body.title || '', undefined);
      tags = analysis.entities.map(e => e.value);
    }
    // Insert case
    const newCase = {
      id: crypto.randomUUID(),
      ...body,
      tags: JSON.stringify(tags),
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const [insertedCase] = await db.insert(cases).values(newCase).returning();
    // Link crimes (if provided)
    if (body.crimes && Array.isArray(body.crimes)) {
      for (const crime of body.crimes) {
        await db.insert(crimes).values({ ...crime, id: crypto.randomUUID(), caseId: insertedCase.id, createdBy: userId });
      }
    }
    // Link law paragraphs (if provided)
    if (body.lawLinks && Array.isArray(body.lawLinks)) {
      for (const link of body.lawLinks) {
        await db.insert(caseLawLinks).values({ ...link, id: crypto.randomUUID(), caseId: insertedCase.id });
      }
    }
    // Invalidate relevant caches
    invalidateCacheByTags([cacheTags.cases, `user:${userId}`]);
    return json({ success: true, case: insertedCase });
  } catch (error) {
    console.error('Failed to create case:', error);
    return json({ error: 'Failed to create case' }, { status: 500 });
  }
};
