/**
 * Qdrant Embeddings Suggestions API Endpoint
 * 
 * Provides search suggestions based on existing canvas text
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { embeddingService } from '$lib/services/qdrant-embeddings';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { query, canvasId, limit = 5 } = await request.json();

		if (!query || typeof query !== 'string') {
			return json(
				{ error: 'Query parameter is required and must be a string' },
				{ status: 400 }
			);
		}

		// Perform similarity search to get suggestions
		const searchResult = await embeddingService.searchSimilar(query, {
			limit: Math.min(limit * 2, 20), // Get more results to filter
			canvasId,
			threshold: 0.3 // Lower threshold for suggestions
		});

		// Extract unique text suggestions
		const suggestions = Array.from(new Set(
			searchResult.items
				.filter(item => item.metadata.text.toLowerCase() !== query.toLowerCase())
				.map(item => item.metadata.text)
				.slice(0, limit)
		));

		return json({
			success: true,
			suggestions,
			query,
			total: suggestions.length
		});

	} catch (error) {
		console.error('Embedding suggestions error:', error);
		
		return json(
			{
				error: 'Failed to get suggestions',
				details: error instanceof Error ? error.message : 'Unknown error',
				suggestions: []
			},
			{ status: 500 }
		);
	}
};
