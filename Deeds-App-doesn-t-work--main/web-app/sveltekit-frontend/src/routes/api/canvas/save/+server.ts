import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, canvasStates } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { caseId, canvasData, imagePreview, metadata } = await request.json();

    if (!caseId || !canvasData) {
      return json(
        { error: 'Missing required fields: caseId and canvasData' },
        { status: 400 }
      );
    }

    // Check if canvas state already exists for this case
    const existing = await db
      .select()
      .from(canvasStates)
      .where(eq(canvasStates.caseId, caseId))
      .limit(1);

    const canvasState = {
      caseId,
      canvasData: JSON.stringify(canvasData),
      imagePreview,
      metadata: JSON.stringify(metadata || {}),
      updatedAt: new Date()
    };

    let result;
    if (existing.length > 0) {
      // Update existing canvas state
      result = await db
        .update(canvasStates)
        .set(canvasState)
        .where(eq(canvasStates.caseId, caseId))
        .returning();
    } else {
      // Create new canvas state
      result = await db
        .insert(canvasStates)
        .values({
          ...canvasState,
          createdAt: new Date()
        })
        .returning();
    }

    return json({
      success: true,
      id: result[0].id,
      message: 'Canvas state saved successfully'
    });

  } catch (error) {
    console.error('Canvas save error:', error);
    return json(
      { error: 'Failed to save canvas state' },
      { status: 500 }
    );
  }
};
