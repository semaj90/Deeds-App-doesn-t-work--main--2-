import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { userFeedback } from '$lib/server/db/schema-new';
import { nanoid } from 'nanoid';

export const POST = async ({ request }: RequestEvent) => {
  try {
    // TODO: Get user from session/auth - for now using placeholder
    const userId = 'placeholder-user-id'; // Replace with actual user authentication
    
    const body = await request.json();
    const { 
      query, 
      llmResponse, 
      userRating, 
      feedbackType, 
      userComments, 
      sessionId, 
      context 
    } = body;

    if (!query || !llmResponse || !userRating) {
      return json({ 
        error: 'Query, LLM response, and user rating are required' 
      }, { status: 400 });
    }

    if (userRating < 1 || userRating > 5) {
      return json({ 
        error: 'User rating must be between 1 and 5' 
      }, { status: 400 });
    }

    // Save the feedback
    await db.insert(userFeedback).values({
      userId,
      sessionId,
      query,
      llmResponse,
      userRating,
      feedbackType,
      userComments,
      context: context || {},
      wasFixed: false,
    });

    return json({ 
      message: 'Feedback submitted successfully',
      rating: userRating 
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    return json({ 
      error: 'Failed to submit feedback', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
};
