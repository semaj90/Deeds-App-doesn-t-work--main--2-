/**
 * Qdrant Embeddings Search API Endpoint
 * 
 * Provides semantic search capabilities for canvas text content
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { embeddingService } from '$lib/services/qdrant-embeddings';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const {
			query,
			canvasId,
			caseId,
			isEvidence,
			limit = 10,
			threshold
		} = await request.json();

		if (!query || typeof query !== 'string') {
			return json(
				{ error: 'Query parameter is required and must be a string' },
				{ status: 400 }
			);
		}

		// Perform semantic search
		const searchResult = await embeddingService.searchSimilar(query, {
			limit: Math.min(limit, 50), // Cap at 50 results
			canvasId,
			caseId,
			isEvidence,
			threshold
		});

		return json({
			success: true,
			result: searchResult,
			timestamp: new Date().toISOString()
		});

	} catch (error) {
		console.error('Embedding search error:', error);
		
		return json(
			{
				error: 'Failed to search embeddings',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
