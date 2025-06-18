import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { contentEmbeddings } from '$lib/server/db/schema';

export async function POST({ request }) {
    const { entityId, entityType, contentType, embedding, text } = await request.json();

    if (!entityId || !entityType || !contentType || !embedding || !text) {
        return json({ error: 'entityId, entityType, contentType, embedding, and text are required' }, { status: 400 });
    }

    try {
        const newEmbedding = await db.insert(contentEmbeddings).values({
            entityId,
            entityType,
            contentType,
            embedding,
            text,
        }).returning();

        return json(newEmbedding[0], { status: 201 });
    } catch (error) {
        console.error('Error creating content embedding:', error);
        return json({ error: 'Failed to create content embedding' }, { status: 500 });
    }
}