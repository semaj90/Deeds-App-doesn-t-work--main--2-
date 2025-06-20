import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { cache } from '$lib/server/cache/cache';
import { db } from '$lib/server/db';
import { cases, caseRelationshipFeedback } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const LLM_SERVICE_URL = env.LLM_SERVICE_URL;
const GEMINI_API_KEY = env.GEMINI_API_KEY;
const OPENAI_API_KEY = env.OPENAI_API_KEY;
const IS_PRODUCTION = env.NODE_ENV === 'production';

interface SummarizeRequest {
    text: string;
    caseId?: string;
    contextType?: 'case' | 'evidence' | 'statute' | 'general';
    maxLength?: number;
    style?: 'brief' | 'detailed' | 'legal' | 'narrative';
}

interface RAGContext {
    caseData?: any;
    relatedCases?: any[];
    userFeedback?: any[];
    statutes?: any[];
}

export async function POST({ request }: { request: Request }) {
    try {
        const body: SummarizeRequest = await request.json();
        const { text, caseId, contextType = 'general', maxLength = 500, style = 'brief' } = body;

        if (!text || text.trim().length < 10) {
            return json({ 
                error: 'Text must be at least 10 characters long' 
            }, { status: 400 });
        }

        // Generate cache key
        const cacheKey = `nlp:summarize:${contextType}:${style}:${text.slice(0, 100)}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            return json(cached);
        }

        // Gather RAG context if caseId is provided
        let ragContext: RAGContext = {};
        if (caseId) {
            ragContext = await gatherRAGContext(caseId);
        }

        // Choose LLM service based on environment
        let summary: string;
        if (IS_PRODUCTION) {
            // Use Gemini API for production (Vercel)
            summary = await summarizeWithGemini(text, ragContext, style, maxLength);
        } else {
            // Use local LLM service for development/Tauri
            summary = await summarizeWithLocalLLM(text, ragContext, style, maxLength);
        }

        const result = {
            summary,
            originalLength: text.length,
            summaryLength: summary.length,
            contextType,
            style,
            timestamp: new Date().toISOString()
        };

        // Cache for 30 minutes
        cache.set(cacheKey, result, 1800000, ['nlp', 'summarize']);

        return json(result);

    } catch (error) {
        console.error('Error in summarize endpoint:', error);
        return json({
            error: 'Failed to generate summary',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

async function gatherRAGContext(caseId: string): Promise<RAGContext> {
    try {
        // Fetch case data
        const caseData = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
        
        // Fetch user feedback for this case (for learning what users find valuable)
        const userFeedback = await db.select()
            .from(caseRelationshipFeedback)
            .where(eq(caseRelationshipFeedback.parentCaseId, caseId))
            .limit(10);

        // TODO: Add related cases based on similarity/feedback
        // TODO: Add relevant statutes

        return {
            caseData: caseData[0] || null,
            relatedCases: [], // Implement based on similarity
            userFeedback,
            statutes: [] // Implement based on case type
        };
    } catch (error) {
        console.error('Error gathering RAG context:', error);
        return {};
    }
}

async function summarizeWithGemini(
    text: string, 
    ragContext: RAGContext, 
    style: string, 
    maxLength: number
): Promise<string> {
    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured');
    }

    const contextPrompt = buildContextPrompt(ragContext);
    const prompt = `${contextPrompt}

Please summarize the following text in a ${style} style, keeping it under ${maxLength} characters:

TEXT TO SUMMARIZE:
${text}

SUMMARY:`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                maxOutputTokens: Math.floor(maxLength / 4), // Rough token estimation
                temperature: 0.3,
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Summary generation failed';
}

async function summarizeWithLocalLLM(
    text: string, 
    ragContext: RAGContext, 
    style: string, 
    maxLength: number
): Promise<string> {
    if (!LLM_SERVICE_URL) {
        throw new Error('Local LLM service not configured');
    }

    const contextPrompt = buildContextPrompt(ragContext);
    const prompt = `${contextPrompt}

Please summarize the following text in a ${style} style, keeping it under ${maxLength} characters:

TEXT TO SUMMARIZE:
${text}

SUMMARY:`;

    const response = await fetch(`${LLM_SERVICE_URL}/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            prompt,
            max_tokens: Math.floor(maxLength / 4),
            temperature: 0.3,
            stream: false
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Local LLM service error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.response?.trim() || 'Summary generation failed';
}

function buildContextPrompt(ragContext: RAGContext): string {
    let context = "You are a legal assistant helping to summarize legal documents and cases.";
    
    if (ragContext.caseData) {
        context += `\n\nCASE CONTEXT: This summary is for case "${ragContext.caseData.title}" with status "${ragContext.caseData.status}".`;
    }
    
    if (ragContext.userFeedback && ragContext.userFeedback.length > 0) {
        const positiveCount = ragContext.userFeedback.filter(f => f.userScore > 0).length;
        context += `\n\nUSER FEEDBACK: Users have provided ${positiveCount} positive and ${ragContext.userFeedback.length - positiveCount} negative feedback on similar content.`;
    }
    
    return context;
}

export async function GET() {
    return json({
        message: 'NLP Summarization API',
        endpoints: {
            POST: 'Generate summary with RAG context'
        },
        usage: {
            text: 'Text to summarize (required)',
            caseId: 'Case ID for RAG context (optional)',
            contextType: 'Type of content: case, evidence, statute, general (optional)',
            maxLength: 'Maximum summary length in characters (optional, default: 500)',
            style: 'Summary style: brief, detailed, legal, narrative (optional, default: brief)'
        },
        environment: IS_PRODUCTION ? 'production (Gemini)' : 'development (Local LLM)'
    });
}
