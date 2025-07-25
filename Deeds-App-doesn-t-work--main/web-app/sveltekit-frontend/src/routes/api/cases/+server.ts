// --- CACHE STRATEGY NOTE ---
// This API route uses LokiJS for fast, in-memory caching of server-side data (API responses, session data, etc).
// LokiJS is simple and efficient for local/server caching and works well for most SvelteKit apps.
// ---
// If you need distributed caching (e.g., for LLM/NLP microservices, multi-server, or Docker/Kubernetes deployments),
// consider Redis (free, open-source, BSD license). Redis allows sharing cache/state between multiple Node.js processes or services.
// LokiJS: operates on explicit data/keys (no semantic search)
// Redis: also operates on explicit data/keys, but is distributed and persistent
// For semantic/embedding-based cache ("understands" meaning), you would use a vector DB or embedding store (not Loki/Redis).
// ---
// Example Redis usage (Node.js/SvelteKit):
// import { createClient } from 'redis';
// const redis = createClient({ url: 'redis://localhost:6379' });
// await redis.connect();
// await redis.set('key', 'value', { EX: 60 }); // Set with 60s expiry
// const value = await redis.get('key');
// await redis.disconnect();
// ---
// For now, this app uses LokiJS for in-memory cache. For LLM/NLP or semantic search, we will use a vector DB (Qdrant) via Docker container, and Drizzle ORM with Postgres for all structured data. This stack is ideal for a SvelteKit prosecutor case management app.
// ---

import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { cases, caseActivities, caseCriminals } from '$lib/server/db/schema-new'; // Use unified schema
import { eq, and, sql, ilike, or, type SQL } from 'drizzle-orm';
import { withCache, cacheKeys, cacheTags, invalidateCacheByTags } from '$lib/server/cache/cache';
import type { RequestHandler } from './$types';
import { nlpClient } from '$lib/nlp/client'; // Use the client-side NLP client
import { randomUUID } from 'crypto';

// GET /api/cases - List all cases for the logged-in user, with optional search and tag filter
export const GET: RequestHandler = async ({ url, locals }) => {
  const userId = locals.user?.id;
  if (!userId) return json({ error: 'Unauthorized' }, { status: 401 });

  const search = url.searchParams.get('search');
  const status = url.searchParams.get('status');
  const tagsParam = url.searchParams.get('tags'); // comma-separated tags
  const tags = tagsParam ? tagsParam.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [];

  // Cache key based on user and filters
  const cacheKey = cacheKeys.cases?.byUser?.(userId) ?? `cases:user:${userId}`;
  return await withCache(cacheKey, async () => {
    // Build query
    const conditions: (SQL | undefined)[] = [eq(cases.createdBy, userId)];
    if (status) {
      conditions.push(eq(cases.status, status));
    }
    // Search by title/description
    if (search) {
      const searchPattern = `%${search.toLowerCase()}%`;
      conditions.push(
        or(
          ilike(cases.title, searchPattern),
          ilike(cases.description, searchPattern)
        )
      );
    }
    if (tags.length > 0) {
      // PostgreSQL JSONB: check if any tag is present in the aiTags array
      conditions.push(sql`${cases.aiTags} ?| ${tags}`);
    }

    const definedConditions = conditions.filter((c): c is SQL => !!c);

    // Fetch cases
    const casesWithRelations = await db.select().from(cases).where(and(...definedConditions));
    // Use 10 min TTL for cache (600000 ms)
    return json({ cases: casesWithRelations });
  }, 600000);
};

// POST /api/cases - Create a new case
export const POST: RequestHandler = async ({ request, locals }) => {
  const userId = locals.user?.id;
  if (!userId) return json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { title, description, aiTags: inputAiTags, status: bodyStatus } = body;
    let aiTags = inputAiTags || [];
    if (!aiTags.length && (description || title)) {
      // Use NLP client to generate tags if not provided
      try {
        aiTags = await nlpClient.suggestTags(description || title);
      } catch (err) {
        console.error("NLP Error:", err);
        aiTags = [];
      }
    }
    // Generate a robust unique case number using UUID
    const caseNumber = `CASE-${randomUUID()}`;
    // Insert case
    const [insertedCase] = await db.insert(cases).values({
      title,
      description,
      aiTags,
      createdBy: userId,
      caseNumber,
      status: bodyStatus || 'new',
      updatedAt: new Date()
    }).returning();
    // Invalidate relevant caches
    await invalidateCacheByTags([cacheTags.cases, `user:${userId}`]);

    // Log activity
    await db.insert(caseActivities).values({
      caseId: insertedCase.id,
      createdBy: userId,
      activityType: 'case_created',
      title: 'Case Created',
      description: `Case '${insertedCase.title}' created.`,
      metadata: { details: `Case created by user ${userId}` }
    });

    return json(insertedCase, { status: 201 });
  } catch (error) {
    console.error('Error creating case:', error);
    return json({ error: 'Failed to create case' }, { status: 500 });
  }
};
