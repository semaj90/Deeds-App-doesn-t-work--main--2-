import { json } from '@sveltejs/kit';
import { caseNLPParser } from '$lib/nlp/caseParser';

export async function POST({ request }) {
    try {
        const { description } = await request.json();

        if (!description || description.trim().length < 10) {
            return json({ 
                error: 'Description must be at least 10 characters long' 
            }, { status: 400 });
        }

        // Perform NLP analysis
        const analysis = await caseNLPParser.analyzeCaseDescription(description);
        
        // Search for similar criminals based on extracted entities
        const suggestedCriminals = await caseNLPParser.searchSimilarCriminals(analysis.extractedEntities);

        return json({
            analysis,
            suggestedCriminals,
            success: true
        });
    } catch (error) {
        console.error('Error processing NLP request:', error);
        return json({
            error: 'Failed to process case description',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function GET() {
    return json({
        message: 'NLP Processing API',
        endpoints: {
            POST: 'Analyze case description with NLP'
        },
        usage: {
            description: 'Send a POST request with { "description": "case description" }'
        }
    });
}
