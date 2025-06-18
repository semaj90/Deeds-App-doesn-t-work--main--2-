import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { lawParagraphs } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function GET({ params }) {
    const { id } = params;
    const lawParagraph = await db.select().from(lawParagraphs).where(eq(lawParagraphs.id, parseInt(id))).limit(1);

    if (!lawParagraph.length) {
        return json({ error: 'Law paragraph not found' }, { status: 404 });
    }

    return json(lawParagraph[0]);
}

export async function PUT({ params, request }) {
    const { id } = params;
    const { paragraphText, anchorId, linkedCaseIds, crimeSuggestions } = await request.json();

    const updatedLawParagraph = await db.update(lawParagraphs)
        .set({
            paragraphText: paragraphText,
            anchorId: anchorId,
            linkedCaseIds: linkedCaseIds,
            crimeSuggestions: crimeSuggestions,
        })
        .where(eq(lawParagraphs.id, parseInt(id)))
        .returning();

    if (!updatedLawParagraph.length) {
        return json({ error: 'Law paragraph not found' }, { status: 404 });
    }

    return json(updatedLawParagraph[0]);
}

export async function DELETE({ params }) {
    const { id } = params;

    const deletedLawParagraph = await db.delete(lawParagraphs).where(eq(lawParagraphs.id, parseInt(id))).returning();

    if (!deletedLawParagraph.length) {
        return json({ error: 'Law paragraph not found' }, { status: 404 });
    }

    return new Response(null, { status: 204 });
}