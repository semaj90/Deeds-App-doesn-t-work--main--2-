import { json } from '@sveltejs/kit';
import { PredictiveAnalyzer } from '$lib/server/nlp/analyzer.js';

export async function POST({ request }) {
    try {
        const { description, caseId } = await request.json();

        if (!description || description.trim().length < 10) {
            return json({ 
                error: 'Description must be at least 10 characters long' 
            }, { status: 400 });
        }

        // Perform NLP analysis using the server-side analyzer
        const analyzer = new PredictiveAnalyzer();
        const analysis = await analyzer.analyzeCaseDescription(description, caseId);

        return json({
            analysis,
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
