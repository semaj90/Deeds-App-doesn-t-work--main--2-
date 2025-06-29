import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { prompt, vibe, context } = await request.json();

		if (!prompt || typeof prompt !== 'string') {
			return json({ error: 'Prompt is required' }, { status: 400 });
		}

		// Mock AI response for now - in production this would call a real AI service
		const response = await generateAIResponse(prompt, vibe, context);

		return json({
			response: response.text,
			suggestions: response.suggestions,
			actions: response.actions
		});
	} catch (error) {
		console.error('AI suggestion error:', error);
		return json(
			{ error: 'Failed to generate AI suggestion' },
			{ status: 500 }
		);
	}
};

async function generateAIResponse(
	prompt: string,
	vibe: string = 'professional',
	context?: any
) {
	// Simulate AI processing delay
	await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

	const vibeResponses = {
		professional: {
			prefix: "Based on my analysis of the case materials,",
			style: "formal and detailed"
		},
		creative: {
			prefix: "Looking at this from a fresh perspective,",
			style: "innovative and exploratory"
		},
		analytical: {
			prefix: "From a systematic examination of the evidence,",
			style: "logical and methodical"
		},
		collaborative: {
			prefix: "Building on the team's previous work,",
			style: "inclusive and building"
		}
	};

	const currentVibe = vibeResponses[vibe as keyof typeof vibeResponses] || vibeResponses.professional;

	// Generate response based on prompt content
	let responseText = `${currentVibe.prefix} `;
	
	if (prompt.toLowerCase().includes('evidence')) {
		responseText += "I recommend focusing on the documentary evidence patterns that show consistency in the timeline. Consider cross-referencing witness statements with physical evidence locations.";
	} else if (prompt.toLowerCase().includes('timeline')) {
		responseText += "The chronological sequence suggests three key phases. I'd suggest creating visual markers for each phase to highlight the progression of events.";
	} else if (prompt.toLowerCase().includes('witness')) {
		responseText += "The witness testimony reveals interesting correlations. Consider mapping their locations and perspectives to identify potential blind spots or confirmatory evidence.";
	} else if (prompt.toLowerCase().includes('analysis')) {
		responseText += "A multi-layered approach would be beneficial here. I suggest breaking down the components into discrete elements for individual examination before synthesis.";
	} else {
		responseText += "This presents an interesting challenge that would benefit from systematic documentation and cross-referencing with existing case law precedents.";
	}

	// Add context-specific suggestions
	const suggestions = [
		"Review similar cases in the database",
		"Create a visual timeline of events",
		"Map evidence to witness statements",
		"Identify gaps that need additional research",
		"Consider alternative interpretations"
	];

	// Generate actionable items
	const actions = [
		{
			type: 'highlight',
			text: 'Mark key evidence for review',
			data: { priority: 'high' }
		},
		{
			type: 'annotation',
			text: 'Add detailed notes to timeline',
			data: { category: 'timeline' }
		},
		{
			type: 'research',
			text: 'Search for similar case precedents',
			data: { keywords: extractKeywords(prompt) }
		}
	];

	return {
		text: responseText,
		suggestions: suggestions.slice(0, 3), // Return top 3 suggestions
		actions: actions
	};
}

function extractKeywords(text: string): string[] {
	// Simple keyword extraction - in production would use NLP
	const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
	const words = text.toLowerCase()
		.replace(/[^\w\s]/g, ' ')
		.split(/\s+/)
		.filter(word => word.length > 3 && !commonWords.includes(word));
	
	return [...new Set(words)].slice(0, 5);
}
