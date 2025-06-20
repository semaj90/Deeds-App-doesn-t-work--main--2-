import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { cache } from '$lib/server/cache/cache';
import { db } from '$lib/server/db';
import { savedStatements, cases } from '$lib/server/db/schema';
import { like, desc } from 'drizzle-orm';

const LLM_SERVICE_URL = env.LLM_SERVICE_URL;
const GEMINI_API_KEY = env.GEMINI_API_KEY;
const IS_PRODUCTION = env.NODE_ENV === 'production';

interface AutocompleteRequest {
    text: string;
    context?: string;
    category?: string;
    maxSuggestions?: number;
    includeTemplates?: boolean;
}

interface AutocompleteSuggestion {
    text: string;
    type: 'completion' | 'template' | 'ai_generated';
    confidence: number;
    source: string;
    category?: string;
}

export async function POST({ request }: { request: Request }) {
    try {
        const body: AutocompleteRequest = await request.json();
        const { 
            text, 
            context = '', 
            category = 'general',
            maxSuggestions = 5,
            includeTemplates = true
        } = body;

        if (!text || text.trim().length < 2) {
            return json({ 
                error: 'Text must be at least 2 characters long' 
            }, { status: 400 });
        }

        // Generate cache key
        const cacheKey = `nlp:autocomplete:${category}:${text.slice(0, 50)}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            return json(cached);
        }

        const suggestions: AutocompleteSuggestion[] = [];

        // 1. Get template-based suggestions
        if (includeTemplates) {
            const templateSuggestions = await getTemplateSuggestions(text, category, maxSuggestions);
            suggestions.push(...templateSuggestions);
        }

        // 2. Get AI-generated suggestions
        if (suggestions.length < maxSuggestions) {
            const aiSuggestions = await getAISuggestions(
                text, 
                context, 
                category, 
                maxSuggestions - suggestions.length
            );
            suggestions.push(...aiSuggestions);
        }

        // 3. Sort by confidence and relevance
        suggestions.sort((a, b) => b.confidence - a.confidence);

        const result = {
            suggestions: suggestions.slice(0, maxSuggestions),
            query: text,
            context,
            category,
            timestamp: new Date().toISOString()
        };

        // Cache for 10 minutes
        cache.set(cacheKey, result, 600000, ['nlp', 'autocomplete']);

        return json(result);

    } catch (error) {
        console.error('Error in suggest-autocomplete endpoint:', error);
        return json({
            error: 'Failed to generate autocomplete suggestions',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

async function getTemplateSuggestions(
    text: string, 
    category: string, 
    maxResults: number
): Promise<AutocompleteSuggestion[]> {
    try {
        const templates = await db.select()
            .from(savedStatements)
            .where(like(savedStatements.content, `%${text}%`))
            .orderBy(desc(savedStatements.usageCount))
            .limit(maxResults);

        return templates.map(template => ({
            text: template.content,
            type: 'template' as const,
            confidence: 0.9,
            source: 'saved_templates',
            category: template.category
        }));
    } catch (error) {
        console.error('Error fetching template suggestions:', error);
        return [];
    }
}

async function getAISuggestions(
    text: string, 
    context: string, 
    category: string, 
    maxResults: number
): Promise<AutocompleteSuggestion[]> {
    try {        if (IS_PRODUCTION && GEMINI_API_KEY) {
            return await getAISuggestionsWithGemini(text, context, category, maxResults);
        } else if (LLM_SERVICE_URL) {
            return await getAISuggestionsWithLocalLLM(text, context, category, maxResults);
        } else {
            return getRuleBasedSuggestions(text, category, maxResults);
        }
    } catch (error) {
        console.error('Error getting AI suggestions:', error);
        return [];
    }
}

async function getAISuggestionsWithGemini(
    text: string, 
    context: string, 
    category: string, 
    maxResults: number
): Promise<AutocompleteSuggestion[]> {
    const prompt = `You are a legal writing assistant. Complete the following text in a professional, legal context.

CATEGORY: ${category}
CONTEXT: ${context}
PARTIAL TEXT: "${text}"

Provide ${maxResults} different completions that are:
1. Legally appropriate and professional
2. Contextually relevant
3. Concise and clear

Return only a JSON array of completion strings, no other text:`;

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
                maxOutputTokens: 500,
                temperature: 0.7,
            }
        })
    });

    if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    try {
        const completions = JSON.parse(responseText);
        return completions.map((completion: string, index: number) => ({
            text: completion,
            type: 'ai_generated' as const,
            confidence: 0.8 - (index * 0.1),
            source: 'gemini',
            category
        }));
    } catch {
        return [];
    }
}

async function getAISuggestionsWithLocalLLM(
    text: string, 
    context: string, 
    category: string, 
    maxResults: number
): Promise<AutocompleteSuggestion[]> {
    const response = await fetch(`${LLM_SERVICE_URL}/suggest-autocomplete`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text,
            context,
            category,
            max_suggestions: maxResults
        })
    });

    if (!response.ok) {
        return [];
    }

    const data = await response.json();
    return data.suggestions?.map((suggestion: any, index: number) => ({
        text: suggestion.text || suggestion,
        type: 'ai_generated' as const,
        confidence: suggestion.confidence || (0.8 - (index * 0.1)),
        source: 'local_llm',
        category
    })) || [];
}

function getRuleBasedSuggestions(
    text: string, 
    category: string, 
    maxResults: number
): AutocompleteSuggestion[] {
    const legalPhrases = [
        'the defendant did willfully and unlawfully',
        'based on the evidence presented',
        'in accordance with applicable law',
        'the prosecution hereby submits',
        'pursuant to the charges filed',
        'the court should consider',
        'the evidence clearly demonstrates',
        'in violation of state statute',
        'the facts of this case show',
        'the defendant is charged with'
    ];

    const filtered = legalPhrases
        .filter(phrase => phrase.toLowerCase().includes(text.toLowerCase()))
        .slice(0, maxResults);

    return filtered.map((phrase, index) => ({
        text: phrase,
        type: 'completion' as const,
        confidence: 0.6 - (index * 0.1),
        source: 'rule_based',
        category
    }));
}

export async function GET() {
    return json({
        message: 'NLP Autocomplete Suggestions API',
        endpoints: {
            POST: 'Get autocomplete suggestions'
        },
        usage: {
            text: 'Partial text to complete (required)',
            context: 'Additional context for better suggestions (optional)',
            category: 'Content category: opening, closing, evidence_description, legal_argument (optional)',
            maxSuggestions: 'Maximum number of suggestions (optional, default: 5)',
            includeTemplates: 'Include saved templates in suggestions (optional, default: true)'
        },
        supportedCategories: [
            'opening', 'closing', 'evidence_description', 'legal_argument', 'general'
        ],
        environment: IS_PRODUCTION ? 'production (Gemini + Templates)' : 'development (Local LLM + Templates + Rule-based)'
    });
}
