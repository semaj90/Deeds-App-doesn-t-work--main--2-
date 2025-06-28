import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { cases } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, url }) => {
  try {
    if (!locals.user) {
      return json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!db) {
      return json({ error: 'Database not available' }, { status: 500 });
    }

    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const caseResults = await db.select()
      .from(cases)
      .orderBy(desc(cases.updatedAt))
      .limit(limit)
      .offset(offset);

    return json(caseResults);
  } catch (error) {
    console.error('Error fetching cases:', error);
    return json({ error: 'Failed to fetch cases' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    if (!locals.user) {
      return json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!db) {
      return json({ error: 'Database not available' }, { status: 500 });
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.title || !data.caseNumber) {
      return json({ error: 'Title and case number are required' }, { status: 400 });
    }

    const caseData = {
      title: data.title,
      description: data.description || '',
      caseNumber: data.caseNumber,
      caseType: data.caseType || 'criminal',
      status: data.status || 'pending',
      priority: data.priority || 'medium',
      jurisdiction: data.jurisdiction || '',
      assignedProsecutor: data.assignedProsecutor || locals.user.id,
      defendants: data.defendants || [],
      charges: data.charges || [],
      courtDate: data.courtDate || null,
      tags: data.tags || [],
      metadata: data.metadata || {},
      createdBy: locals.user.id,
      lastEditedBy: locals.user.id
    };

    const [newCase] = await db.insert(cases).values(caseData).returning();

    return json(newCase, { status: 201 });
  } catch (error) {
    console.error('Error creating case:', error);
    return json({ error: 'Failed to create case' }, { status: 500 });
  }
};
