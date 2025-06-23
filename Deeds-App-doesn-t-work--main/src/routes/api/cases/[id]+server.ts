import { json, type RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { cases } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/cases/[id] - Get a single case for the logged-in user
export async function GET({ params, locals }: RequestEvent) {
    const userId = locals.session?.userId;
    const caseId = params.id;
    if (!userId || !caseId) {
        return json({ error: 'Unauthorized or missing case ID' }, { status: 401 });
    }
    const found = await (db as any).select().from(cases).where(and(eq(cases.id, caseId), eq(cases.createdBy, userId)));
    if (!found.length) {
        return json({ error: 'Case not found or access denied' }, { status: 404 });
    }
    return json(found[0]);
}

// PUT /api/cases/[id] - Update a case (only if owned by user)
export async function PUT({ params, locals, request }: RequestEvent) {
    const userId = locals.session?.userId;
    const caseId = params.id;
    if (!userId || !caseId) {
        return json({ error: 'Unauthorized or missing case ID' }, { status: 401 });
    }
    const { title, description, dangerScore, status, aiSummary } = await request.json();
    const updated = await (db as any).update(cases)
        .set({ title, description, dangerScore, status, aiSummary })
        .where(and(eq(cases.id, caseId), eq(cases.createdBy, userId)))
        .returning();
    if (!updated.length) {
        return json({ error: 'Case not found or access denied' }, { status: 404 });
    }
    return json(updated[0]);
}

// DELETE /api/cases/[id] - Delete a case (only if owned by user)
export async function DELETE({ params, locals }: RequestEvent) {
    const userId = locals.session?.userId;
    const caseId = params.id;
    if (!userId || !caseId) {
        return json({ error: 'Unauthorized or missing case ID' }, { status: 401 });
    }
    const deleted = await (db as any).delete(cases)
        .where(and(eq(cases.id, caseId), eq(cases.createdBy, userId)))
        .returning();
    if (!deleted.length) {
        return json({ error: 'Case not found or access denied' }, { status: 404 });
    }
    return json({ success: true });
}
