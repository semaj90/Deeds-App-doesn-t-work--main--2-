import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { contentEmbeddings } from '$lib/server/db/schema';

export async function POST({ request }) {
    const { contentId, contentType, embedding } = await request.json();

    if (!contentId || !contentType || !embedding) {
        return json({ error: 'contentId, contentType, and embedding are required' }, { status: 400 });
    }

    try {
        const newEmbedding = await db.insert(contentEmbeddings).values({
            contentId: parseInt(contentId),
            contentType,
            embedding,
        }).returning();

        return json(newEmbedding[0], { status: 201 });
    } catch (error) {
        console.error('Error creating content embedding:', error);
        return json({ error: 'Failed to create content embedding' }, { status: 500 });
    }
}