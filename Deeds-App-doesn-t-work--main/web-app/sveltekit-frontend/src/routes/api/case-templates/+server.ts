import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { caseTemplates } from '$lib/server/db/schema';
import { eq, desc, like } from 'drizzle-orm';
import { cache, invalidateCacheByTags } from '$lib/server/cache/cache';

// GET /api/case-templates - Get available case templates
export const GET: RequestHandler = async ({ url, locals }) => {
  const caseType = url.searchParams.get('caseType');
  const search = url.searchParams.get('search');
  
  const cacheKey = `case_templates:${caseType || 'all'}:${search || ''}`;
  
  // Try to get from cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    return json(cached);
  }

  try {
    let query = db.select().from(caseTemplates);
    
    if (caseType) {
      const allTemplates = await db.select()
        .from(caseTemplates)
        .orderBy(desc(caseTemplates.usageCount));
      
      const filteredTemplates = allTemplates.filter(template => 
        template.caseType === caseType
      );
      
      // Cache and return filtered results
      cache.set(cacheKey, filteredTemplates, 600000); // 10 minutes
      return json(filteredTemplates);
    }

    const templates = await query.orderBy(desc(caseTemplates.usageCount)).limit(20);

    // Cache the result
    cache.set(cacheKey, templates, 600000); // 10 minutes

    return json(templates);
  } catch (error) {
    console.error('Error fetching case templates:', error);
    return json({ error: 'Failed to fetch case templates' }, { status: 500 });
  }
};

// POST /api/case-templates - Create a new case template
export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  if (!user?.id) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const {
      name,
      description,
      caseType,
      template,
      fields,
      isPublic
    } = await request.json();

    if (!name || !caseType || !template) {
      return json({ error: 'name, caseType, and template are required' }, { status: 400 });
    }

    const newTemplate = await db.insert(caseTemplates).values({
      id: crypto.randomUUID(),
      name,
      description,
      caseType,
      template: JSON.stringify(template),
      fields: JSON.stringify(fields || []),
      usageCount: 0,
      isPublic: isPublic || false,
      createdBy: user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // Invalidate cache
    invalidateCacheByTags(['case_templates']);

    return json(newTemplate[0], { status: 201 });
  } catch (error) {
    console.error('Error creating case template:', error);
    return json({ error: 'Failed to create case template' }, { status: 500 });
  }
};
