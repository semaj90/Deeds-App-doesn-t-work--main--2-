import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, canvasStates } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }: { url: URL }) => {
  try {
    const caseId = url.searchParams.get('caseId');

    if (!caseId) {
      return json(
        { error: 'Missing required parameter: caseId' },
        { status: 400 }
      );
    }

    const result = await db
      .select()
      .from(canvasStates)
      .where(eq(canvasStates.caseId, caseId))
      .limit(1);

    if (result.length === 0) {
      return json(
        { error: 'Canvas state not found' },
        { status: 404 }
      );
    }

    const canvasState = result[0];

    return json({
      success: true,
      canvasData: JSON.parse(canvasState.canvasData),
      imagePreview: canvasState.imagePreview,
      metadata: JSON.parse(canvasState.metadata || '{}'),
      createdAt: canvasState.createdAt,
      updatedAt: canvasState.updatedAt
    });

  } catch (error) {
    console.error('Canvas load error:', error);
    return json(
      { error: 'Failed to load canvas state' },
      { status: 500 }
    );
  }
};
