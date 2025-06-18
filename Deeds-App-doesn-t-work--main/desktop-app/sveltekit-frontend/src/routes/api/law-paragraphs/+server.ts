import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { lawParagraphs } from '$lib/server/db/schema';

export async function GET() {
    const allLawParagraphs = await db.select().from(lawParagraphs);
    return json(allLawParagraphs);
}

export async function POST({ request }) {
    const { statuteId, paragraphText, anchorId } = await request.json();

    if (!statuteId || !paragraphText || !anchorId) {
        return json({ error: 'statuteId, paragraphText, and anchorId are required' }, { status: 400 });
    }

    try {
        const newLawParagraph = await db.insert(lawParagraphs).values({
            statuteId: parseInt(statuteId),
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