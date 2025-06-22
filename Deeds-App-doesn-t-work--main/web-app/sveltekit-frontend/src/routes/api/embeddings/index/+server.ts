/**
 * Qdrant Embeddings Index API Endpoint
 * 
 * Indexes canvas text content for semantic search
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { embeddingService } from '$lib/services/qdrant-embeddings';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { canvasJson, canvasId, caseId } = await request.json();

		if (!canvasJson || !canvasId || !caseId) {
			return json(
				{ error: 'canvasJson, canvasId, and caseId are required' },
				{ status: 400 }
			);
		}

		// Extract text items from canvas
		const textItems = embeddingService.extractTextItems(canvasJson, canvasId, caseId);

		if (textItems.length === 0) {
			return json({
				success: true,
				message: 'No text items found to index',
				indexed: 0
			});
		}

		// Index the text items
		await embeddingService.indexTextItems(textItems);

		return json({
			success: true,
			message: `Successfully indexed ${textItems.length} text items`,
			indexed: textItems.length,
			textItems: textItems.map(item => ({
				id: item.id,
				text: item.text,
				isEvidence: item.isEvidence
			}))
		});

	} catch (error) {
		console.error('Embedding indexing error:', error);
		
		return json(
			{
				error: 'Failed to index embeddings',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

export const PUT: RequestHandler = async ({ request }) => {
	try {
		const { canvasJson, canvasId, caseId } = await request.json();

		if (!canvasJson || !canvasId || !caseId) {
			return json(
				{ error: 'canvasJson, canvasId, and caseId are required' },
				{ status: 400 }
			);
		}

		// Update embeddings (remove old, add new)
		await embeddingService.updateCanvasEmbeddings(canvasJson, canvasId, caseId);

		// Get updated text items for response
		const textItems = embeddingService.extractTextItems(canvasJson, canvasId, caseId);

		return json({
			success: true,
			message: `Successfully updated embeddings for canvas ${canvasId}`,
			indexed: textItems.length,
			textItems: textItems.map(item => ({
				id: item.id,
				text: item.text,
				isEvidence: item.isEvidence
			}))
		});

	} catch (error) {
		console.error('Embedding update error:', error);
		
		return json(
			{
				error: 'Failed to update embeddings',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

export const DELETE: RequestHandler = async ({ request }) => {
	try {
		const { canvasId } = await request.json();

		if (!canvasId) {
			return json(
				{ error: 'canvasId is required' },
				{ status: 400 }
			);
		}

		// Remove embeddings for this canvas
		await embeddingService.removeCanvasEmbeddings(canvasId);

		return json({
			success: true,
			message: `Successfully removed embeddings for canvas ${canvasId}`
		});

	} catch (error) {
		console.error('Embedding deletion error:', error);
		
		return json(
			{
				error: 'Failed to delete embeddings',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
