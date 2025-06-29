import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { query, context, limit = 10 } = await request.json();

		if (!query || typeof query !== 'string') {
			return json({ error: 'Query is required' }, { status: 400 });
		}

		// Mock Qdrant response for now - in production this would query a real Qdrant instance
		const suggestions = await generateTagSuggestions(query, context, limit);

		return json({
			suggestions,
			metadata: {
				query,
				limit,
				total: suggestions.length
			}
		});
	} catch (error) {
		console.error('Qdrant tag suggestion error:', error);
		return json(
			{ error: 'Failed to generate tag suggestions' },
			{ status: 500 }
		);
	}
};

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		const query = url.searchParams.get('q') || '';
		const limit = parseInt(url.searchParams.get('limit') || '10');
		const category = url.searchParams.get('category') || '';

		const suggestions = await generateTagSuggestions(query, { category }, limit);

		return json({
			suggestions,
			metadata: {
				query,
				limit,
				category,
				total: suggestions.length
			}
		});
	} catch (error) {
		console.error('Qdrant tag search error:', error);
		return json(
			{ error: 'Failed to search tags' },
			{ status: 500 }
		);
	}
};

async function generateTagSuggestions(
	query: string,
	context: any = {},
	limit: number = 10
): Promise<Array<{ tag: string; confidence: number; category?: string; description?: string }>> {
	// Simulate Qdrant processing delay
	await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

	// Mock tag database - in production this would be vectors in Qdrant
	const tagDatabase = [
		// Evidence types
		{ tag: 'document', confidence: 0.95, category: 'evidence-type', description: 'Written documentation' },
		{ tag: 'photograph', confidence: 0.90, category: 'evidence-type', description: 'Visual evidence' },
		{ tag: 'witness-statement', confidence: 0.88, category: 'evidence-type', description: 'Testimony from witnesses' },
		{ tag: 'expert-report', confidence: 0.85, category: 'evidence-type', description: 'Professional analysis' },
		{ tag: 'forensic-analysis', confidence: 0.83, category: 'evidence-type', description: 'Scientific examination' },
		
		// Legal categories
		{ tag: 'criminal-law', confidence: 0.92, category: 'legal-area', description: 'Criminal proceedings' },
		{ tag: 'civil-litigation', confidence: 0.89, category: 'legal-area', description: 'Civil court matters' },
		{ tag: 'contract-dispute', confidence: 0.86, category: 'legal-area', description: 'Contractual disagreements' },
		{ tag: 'personal-injury', confidence: 0.84, category: 'legal-area', description: 'Injury-related cases' },
		{ tag: 'intellectual-property', confidence: 0.81, category: 'legal-area', description: 'IP-related matters' },
		
		// Importance levels
		{ tag: 'critical', confidence: 0.93, category: 'priority', description: 'Highest importance' },
		{ tag: 'important', confidence: 0.87, category: 'priority', description: 'High importance' },
		{ tag: 'relevant', confidence: 0.82, category: 'priority', description: 'Moderate importance' },
		{ tag: 'reference', confidence: 0.76, category: 'priority', description: 'Background information' },
		
		// Status indicators
		{ tag: 'verified', confidence: 0.91, category: 'status', description: 'Confirmed accuracy' },
		{ tag: 'pending-review', confidence: 0.85, category: 'status', description: 'Awaiting examination' },
		{ tag: 'disputed', confidence: 0.79, category: 'status', description: 'Contested information' },
		{ tag: 'confidential', confidence: 0.88, category: 'status', description: 'Sensitive information' },
		
		// Content types
		{ tag: 'timeline', confidence: 0.89, category: 'content-type', description: 'Chronological sequence' },
		{ tag: 'financial-record', confidence: 0.86, category: 'content-type', description: 'Monetary transactions' },
		{ tag: 'communication', confidence: 0.84, category: 'content-type', description: 'Correspondence records' },
		{ tag: 'medical-record', confidence: 0.82, category: 'content-type', description: 'Health-related documents' },
		{ tag: 'property-record', confidence: 0.80, category: 'content-type', description: 'Asset documentation' }
	];

	// Filter and score based on query
	let filteredTags = tagDatabase;

	if (query.trim()) {
		const queryLower = query.toLowerCase();
		filteredTags = tagDatabase
			.map(item => {
				let score = 0;
				
				// Direct match boost
				if (item.tag.toLowerCase().includes(queryLower)) {
					score += 0.8;
				}
				
				// Description match
				if (item.description?.toLowerCase().includes(queryLower)) {
					score += 0.6;
				}
				
				// Category match
				if (item.category?.toLowerCase().includes(queryLower)) {
					score += 0.4;
				}
				
				// Fuzzy matching for similar terms
				const similarity = calculateSimilarity(queryLower, item.tag.toLowerCase());
				score += similarity * 0.5;
				
				return {
					...item,
					confidence: Math.min(item.confidence * (1 + score), 1.0)
				};
			})
			.filter(item => item.confidence > 0.3);
	}

	// Filter by category if specified
	if (context.category) {
		filteredTags = filteredTags.filter(item => item.category === context.category);
	}

	// Sort by confidence and limit results
	return filteredTags
		.sort((a, b) => b.confidence - a.confidence)
		.slice(0, limit);
}

function calculateSimilarity(str1: string, str2: string): number {
	// Simple Levenshtein distance-based similarity
	const maxLength = Math.max(str1.length, str2.length);
	if (maxLength === 0) return 1.0;
	
	const distance = levenshteinDistance(str1, str2);
	return 1 - (distance / maxLength);
}

function levenshteinDistance(str1: string, str2: string): number {
	const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
	
	for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
	for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
	
	for (let j = 1; j <= str2.length; j++) {
		for (let i = 1; i <= str1.length; i++) {
			const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
			matrix[j][i] = Math.min(
				matrix[j][i - 1] + 1,     // deletion
				matrix[j - 1][i] + 1,     // insertion
				matrix[j - 1][i - 1] + indicator   // substitution
			);
		}
	}
	
	return matrix[str2.length][str1.length];
}
