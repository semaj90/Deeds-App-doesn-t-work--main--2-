import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { evidence } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = 'static/uploads/evidence';

export async function GET({ params }) {
    const { id } = params;
    const evidenceItem = await db.select().from(evidence).where(eq(evidence.id, parseInt(id))).limit(1);

    if (!evidenceItem.length) {
        return json({ error: 'Evidence not found' }, { status: 404 });
    }

    return json(evidenceItem[0]);
}

export async function PUT({ params, request }) {
    const { id } = params;
    const { summary, tags, caseId, poiId } = await request.json();

    const updatedEvidence = await db.update(evidence)
        .set({
            summary: summary,
            tags: tags,
            caseId: caseId ? parseInt(caseId) : undefined,
            
        })
        .where(eq(evidence.id, parseInt(id)))
        .returning();

    if (!updatedEvidence.length) {
        return json({ error: 'Evidence not found' }, { status: 404 });
    }

    return json(updatedEvidence[0]);
}

export async function DELETE({ params, locals }) {
    if (!locals.session?.user) {
        return new Response('Unauthorized', { status: 401 });
    }
    const { id } = params;
    const deleted = await db.delete(evidence).where(eq(evidence.id, parseInt(id))).returning();
    if (!deleted.length) {
        return new Response('Not found', { status: 404 });
    }
    // Optionally, delete the file from disk if needed
    // const filePath = path.join(UPLOAD_DIR, deleted[0].fileUrl.replace('/static/uploads/evidence/', ''));
    // await fs.unlink(filePath).catch(() => {});
    return json({ success: true });
}