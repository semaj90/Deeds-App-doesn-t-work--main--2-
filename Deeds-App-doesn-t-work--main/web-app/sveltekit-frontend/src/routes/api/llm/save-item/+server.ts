import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { savedItems, savedItemSourceChunks } from '$lib/server/db/schema-new';
import { nanoid } from 'nanoid';

export const POST = async ({ request }: RequestEvent) => {
  try {
    // TODO: Get user from session/auth - for now using placeholder
    const userId = 'placeholder-user-id'; // Replace with actual user authentication
    
    const body = await request.json();
    const { title, content, originalQuery, tags, sources } = body;

    if (!title || !content) {
      return json({ error: 'Title and content are required' }, { status: 400 });
    }

    // Generate embedding for the content (placeholder - replace with actual embedding service)
    // const embedding = await generateEmbedding(content);
    const embedding = null; // Placeholder

    // Save the main item
    const savedItemId = nanoid();
    await db.insert(savedItems).values({
      userId,
      title: title.trim(),
      content,
      originalQuery,
      tags: tags || [],
      embedding,
      isPrivate: false,
      usage_count: 0,
    });

    // Save source chunks if provided
    if (sources && sources.length > 0) {
      const sourceChunks = sources.map((source: any, index: number) => ({
        savedItemId,
        sourceType: source.sourceType,
        sourceId: source.sourceId,
        chunkText: source.chunkText,
        chunkEmbedding: null, // Placeholder
        relevanceScore: source.relevanceScore?.toString() || '0.5',
        position: index,
        metadata: source.metadata || {},
      }));

      await db.insert(savedItemSourceChunks).values(sourceChunks);
    }

    return json({ 
      id: savedItemId, 
      message: 'Item saved successfully',
      title 
    });

  } catch (error) {
    console.error('Error saving item:', error);
    return json({ 
      error: 'Failed to save item', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
};
