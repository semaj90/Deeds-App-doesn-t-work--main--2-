import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { lawParagraphs } from '$lib/server/db/schema';

export async function GET() {
    const allLawParagraphs = await db.select().from(lawParagraphs);
    return json(allLawParagraphs);
}

export async function POST({ request }) {
    const { statuteId, paragraphText, anchorId, paragraphNumber } = await request.json();

    if (!statuteId || !paragraphText) {
        return json({ error: 'statuteId and paragraphText are required' }, { status: 400 });
    }

    try {
        const newLawParagraph = await db.insert(lawParagraphs).values({
            statuteId,
            paragraphNumber: paragraphNumber || '1',
            content: paragraphText,
            paragraphText,
            anchorId,
            linkedCaseIds: [], // Initialize as empty array
            crimeSuggestions: [], // Initialize as empty array
        }).returning();

        return json(newLawParagraph[0], { status: 201 });
    } catch (error) {
        console.error('Error creating law paragraph:', error);
        return json({ error: 'Failed to create law paragraph' }, { status: 500 });
    }
}