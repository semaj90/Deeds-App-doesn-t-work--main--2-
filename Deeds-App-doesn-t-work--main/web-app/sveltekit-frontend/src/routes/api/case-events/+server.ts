import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { caseEvents, caseRelationships, cases } from '$lib/server/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { cache, invalidateCacheByTags } from '$lib/server/cache/cache';

// GET /api/case-events - Get events for a specific case
export const GET: RequestHandler = async ({ url, locals }) => {
  const caseId = url.searchParams.get('caseId');
  const eventType = url.searchParams.get('eventType');
  
  if (!caseId) {
    return json({ error: 'caseId is required' }, { status: 400 });
  }

  const cacheKey = `case_events:${caseId}:${eventType || 'all'}`;
  
  // Try to get from cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    return json(cached);
  }

  try {
    let events;
    let query = db.select()
      .from(caseEvents)
      .where(eq(caseEvents.caseId, caseId));
    if (eventType) {
      const filteredEvents = await db.select()
        .from(caseEvents)
        .where(eq(caseEvents.caseId, caseId))
        .orderBy(desc(caseEvents.timestamp))
        .limit(50);
      events = filteredEvents.filter((event: any) => event.eventType === eventType);
    } else {
      events = await query.orderBy(desc(caseEvents.timestamp)).limit(50);
    }

    // Cache the result (assume cache.set(key, value, ttlMs))
    cache.set(cacheKey, events, 300000); // 5 minutes

    return json(events);
  } catch (error) {
    console.error('Error fetching case events:', error);
    return json({ error: 'Failed to fetch case events' }, { status: 500 });
  }
};

// POST /api/case-events - Log a new case event
export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  if (!user?.id) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const {
      caseId,
      eventType,
      eventData,
      previousState,
      newState,
      sessionId,
      metadata
    } = await request.json();

    if (!caseId || !eventType || !eventData) {
      return json({ error: 'caseId, eventType, and eventData are required' }, { status: 400 });
    }

    const newEvent = await db.insert(caseEvents).values({
      id: crypto.randomUUID(),
      caseId,
      eventType,
      eventData: JSON.stringify(eventData),
      previousState,
      newState,
      userId: user.id,
      sessionId,
      metadata: JSON.stringify(metadata || {}),
      timestamp: new Date()
    }).returning();

    // Invalidate cache for this case
    invalidateCacheByTags([`case_events:${caseId}`, 'case_events']);

    return json(newEvent[0], { status: 201 });
  } catch (error) {
    console.error('Error creating case event:', error);
    return json({ error: 'Failed to create case event' }, { status: 500 });
  }
};
