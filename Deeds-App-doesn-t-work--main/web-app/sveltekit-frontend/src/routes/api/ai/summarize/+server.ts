import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { content, caseId } = await request.json();

    if (!content || !content.trim()) {
      return json(
        { error: 'Missing required field: content' },
        { status: 400 }
      );
    }

    // Call the Python NLP service for summarization
    const nlpServiceUrl = env.LLM_SERVICE_URL || 'http://localhost:8000';
    const response = await fetch(`${nlpServiceUrl}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: content,
        max_length: 200, // Adjust as needed
        min_length: 50
      })
    });

    if (!response.ok) {
      throw new Error(`NLP service error: ${response.status}`);
    }

    const result = await response.json();

    return json({
      success: true,
      summary: result.summary || result.text,
      metadata: {
        originalLength: content.length,
        summaryLength: (result.summary || result.text).length,
        compressionRatio: content.length / (result.summary || result.text).length,
        caseId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI Summarization error:', error);
    
    // Fallback: Simple text truncation if AI service is unavailable
    const { content } = await request.json();
    const fallbackSummary = content.length > 200 
      ? content.substring(0, 200) + '...' 
      : content;

    return json({
      success: true,
      summary: fallbackSummary,
      fallback: true,
      metadata: {
        originalLength: content.length,
        summaryLength: fallbackSummary.length,
        timestamp: new Date().toISOString()
      }
    });
  }
};
