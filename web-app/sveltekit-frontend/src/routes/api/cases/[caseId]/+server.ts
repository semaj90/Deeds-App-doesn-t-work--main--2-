import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { cases } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    if (!locals.user) {
      return json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!db) {
      return json({ error: 'Database not available' }, { status: 500 });
    }

    const caseId = params.caseId;
    if (!caseId) {
      return json({ error: 'Case ID is required' }, { status: 400 });
    }

    const caseResult = await db.select()
      .from(cases)
      .where(eq(cases.id, caseId))
      .limit(1);

    if (!caseResult.length) {
      return json({ error: 'Case not found' }, { status: 404 });
    }

    return json(caseResult[0]);
  } catch (error) {
    console.error('Error fetching case:', error);
    return json({ error: 'Failed to fetch case' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
  try {
    if (!locals.user) {
      return json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!db) {
      return json({ error: 'Database not available' }, { status: 500 });
    }

    const caseId = params.caseId;
    if (!caseId) {
      return json({ error: 'Case ID is required' }, { status: 400 });
    }

    const data = await request.json();

    // Check if case exists
    const existingCase = await db.select()
      .from(cases)
      .where(eq(cases.id, caseId))
      .limit(1);

    if (!existingCase.length) {
      return json({ error: 'Case not found' }, { status: 404 });
    }

    const updateData: Record<string, any> = {
      lastEditedBy: locals.user.id,
      updatedAt: new Date().toISOString()
    };

    // Only update provided fields
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;
    if (data.defendants !== undefined) updateData.defendants = data.defendants;
    if (data.charges !== undefined) updateData.charges = data.charges;
    if (data.courtDate !== undefined) updateData.courtDate = data.courtDate;

    const [updatedCase] = await db
      .update(cases)
      .set(updateData)
      .where(eq(cases.id, caseId))
      .returning();

    return json(updatedCase);
  } catch (error) {
    console.error('Error updating case:', error);
    return json({ error: 'Failed to update case' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  try {
    if (!locals.user) {
      return json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!db) {
      return json({ error: 'Database not available' }, { status: 500 });
    }

    const caseId = params.caseId;
    if (!caseId) {
      return json({ error: 'Case ID is required' }, { status: 400 });
    }

    // Check if case exists
    const existingCase = await db.select()
      .from(cases)
      .where(eq(cases.id, caseId))
      .limit(1);

    if (!existingCase.length) {
      return json({ error: 'Case not found' }, { status: 404 });
    }

    // Delete the case (cascade will handle related records)
    await db.delete(cases).where(eq(cases.id, caseId));

    return json({ success: true });
  } catch (error) {
    console.error('Error deleting case:', error);
    return json({ error: 'Failed to delete case' }, { status: 500 });
  }
};
