import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { cases } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/cases/[id] - Get a single case by ID (only for owner)
export async function GET({ params, locals }) {
    const userId = locals.user?.id;
    if (!userId) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const caseId = params.id;
        const singleCase = await db.select().from(cases).where(and(eq(cases.id, caseId), eq(cases.createdBy, userId))).limit(1);
        if (singleCase.length === 0) {
            return json({ error: 'Case not found' }, { status: 404 });
        }
        return json(singleCase[0]);
    } catch (error) {
        console.error(`Error fetching case with ID ${params.id}:`, error);
        return json({ error: 'Failed to fetch case', details: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
    }
}

// PUT /api/cases/[id] - Update a case by ID (only for owner)
export async function PUT({ params, request, locals }) {
    const userId = locals.user?.id;
    if (!userId) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    const caseId = params.id;
    try {
        // Only update if the case belongs to the user
        const existing = await db.select().from(cases).where(and(eq(cases.id, caseId), eq(cases.createdBy, userId))).limit(1);
        if (existing.length === 0) {
            return json({ error: 'Case not found or not owned by user' }, { status: 404 });
        }
        const updateData = await request.json();
        const updatedCase = await db.update(cases)
            .set(updateData)
            .where(and(eq(cases.id, caseId), eq(cases.createdBy, userId)))
            .returning();
        return json(updatedCase[0]);
    } catch (error) {
        console.error(`Error updating case with ID ${params.id}:`, error);
        return json({ error: 'Failed to update case', details: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
    }
}

// DELETE /api/cases/[id] - Delete a case by ID (only for owner)
export async function DELETE({ params, locals }) {
    const userId = locals.user?.id;
    if (!userId) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    const caseId = params.id;
    try {
        // Only delete if the case belongs to the user
        const deletedCase = await db.delete(cases)
            .where(and(eq(cases.id, caseId), eq(cases.createdBy, userId)))
            .returning();
        if (deletedCase.length === 0) {
            return json({ error: 'Case not found or not owned by user' }, { status: 404 });
        }
        return json({ message: 'Case deleted successfully' });
    } catch (error) {
        console.error(`Error deleting case with ID ${params.id}:`, error);
        return json({ error: 'Failed to delete case', details: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
    }
}
