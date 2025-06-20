import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { cache } from '$lib/server/cache/cache';

const LLM_SERVICE_URL = env.LLM_SERVICE_URL;
const GEMINI_API_KEY = env.GEMINI_API_KEY;
const OPENAI_API_KEY = env.OPENAI_API_KEY;
const IS_PRODUCTION = env.NODE_ENV === 'production';

interface ExtractEntitiesRequest {
    text: string;
    entityTypes?: string[];
    confidence?: number;
}

interface Entity {
    text: string;
    type: string;
    confidence: number;
    startIndex: number;
    endIndex: number;
}

export async function POST({ request }: { request: Request }) {
    try {
        const body: ExtractEntitiesRequest = await request.json();
        const { 
            text, 
            entityTypes = ['PERSON', 'ORGANIZATION', 'LOCATION', 'DATE', 'CRIME', 'LEGAL_TERM'],
            confidence = 0.7
        } = body;

        if (!text || text.trim().length < 5) {
            return json({ 
                error: 'Text must be at least 5 characters long' 
            }, { status: 400 });
        }

        // Generate cache key
        const cacheKey = `nlp:entities:${entityTypes.join(',')}:${text.slice(0, 100)}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            return json(cached);
        }

        let entities: Entity[];

        if (IS_PRODUCTION && GEMINI_API_KEY) {
            entities = await extractEntitiesWithGemini(text, entityTypes, confidence);
        } else if (LLM_SERVICE_URL) {
            entities = await extractEntitiesWithLocalLLM(text, entityTypes, confidence);
        } else {
            // Fallback to rule-based extraction
            entities = extractEntitiesRuleBased(text, entityTypes, confidence);
        }

        const result = {
            entities,
            entityCount: entities.length,
            entityTypes: [...new Set(entities.map(e => e.type))],
            confidence,
            timestamp: new Date().toISOString()
        };

        // Cache for 1 hour
        cache.set(cacheKey, result, 3600000, ['nlp', 'entities']);

        return json(result);

    } catch (error) {
        console.error('Error in extract-entities endpoint:', error);
        return json({
            error: 'Failed to extract entities',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

async function extractEntitiesWithGemini(
    text: string, 
    entityTypes: string[], 
    confidence: number
): Promise<Entity[]> {
    const prompt = `Extract the following types of entities from the text below and return them in JSON format:

Entity types to extract: ${entityTypes.join(', ')}

For each entity, provide:
- text: the actual text
- type: one of the specified types
- confidence: confidence score (0.0-1.0)
- startIndex: starting character position
- endIndex: ending character position

TEXT:
${text}

Return only a JSON array of entities, no other text:`;

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
                maxOutputTokens: 1000,
                temperature: 0.1,
            }
        })
    });

    if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    try {
        const entities = JSON.parse(responseText);
        return entities.filter((e: Entity) => e.confidence >= confidence);
    } catch {
        // Fallback to rule-based if JSON parsing fails
        return extractEntitiesRuleBased(text, entityTypes, confidence);
    }
}

async function extractEntitiesWithLocalLLM(
    text: string, 
    entityTypes: string[], 
    confidence: number
): Promise<Entity[]> {
    const prompt = `Extract entities of types [${entityTypes.join(', ')}] from: ${text}`;

    const response = await fetch(`${LLM_SERVICE_URL}/extract-entities`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text,
            entity_types: entityTypes,
            confidence_threshold: confidence
        })
    });

    if (!response.ok) {
        // Fallback to rule-based if service is unavailable
        return extractEntitiesRuleBased(text, entityTypes, confidence);
    }

    const data = await response.json();
    return data.entities || [];
}

function extractEntitiesRuleBased(
    text: string, 
    entityTypes: string[], 
    confidence: number
): Entity[] {
    const entities: Entity[] = [];
    
    // Person names (simple pattern matching)
    if (entityTypes.includes('PERSON')) {
        const personPattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
        let match;
        while ((match = personPattern.exec(text)) !== null) {
            entities.push({
                text: match[0],
                type: 'PERSON',
                confidence: 0.8,
                startIndex: match.index,
                endIndex: match.index + match[0].length
            });
        }
    }

    // Locations (addresses, streets)
    if (entityTypes.includes('LOCATION')) {
        const locationPattern = /\d+\s+[A-Za-z\s]+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd)\b/gi;
        let match;
        while ((match = locationPattern.exec(text)) !== null) {
            entities.push({
                text: match[0],
                type: 'LOCATION',
                confidence: 0.9,
                startIndex: match.index,
                endIndex: match.index + match[0].length
            });
        }
    }

    // Organizations
    if (entityTypes.includes('ORGANIZATION')) {
        const orgPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Corp|Corporation|Inc|LLC|Company|Co|Bank|Hospital|School|University)\b/g;
        let match;
        while ((match = orgPattern.exec(text)) !== null) {
            entities.push({
                text: match[0],
                type: 'ORGANIZATION',
                confidence: 0.85,
                startIndex: match.index,
                endIndex: match.index + match[0].length
            });
        }
    }

    // Dates
    if (entityTypes.includes('DATE')) {
        const datePattern = /\b(?:\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b/gi;
        let match;
        while ((match = datePattern.exec(text)) !== null) {
            entities.push({
                text: match[0],
                type: 'DATE',
                confidence: 0.95,
                startIndex: match.index,
                endIndex: match.index + match[0].length
            });
        }
    }

    // Crimes/Legal terms
    if (entityTypes.includes('CRIME') || entityTypes.includes('LEGAL_TERM')) {
        const crimeKeywords = [
            'assault', 'battery', 'theft', 'robbery', 'burglary', 'murder', 'homicide',
            'kidnapping', 'fraud', 'embezzlement', 'trafficking', 'arson', 'vandalism'
        ];
        
        for (const crime of crimeKeywords) {
            const pattern = new RegExp(`\\b${crime}\\b`, 'gi');
            let match;
            while ((match = pattern.exec(text)) !== null) {
                entities.push({
                    text: match[0],
                    type: 'CRIME',
                    confidence: 0.9,
                    startIndex: match.index,
                    endIndex: match.index + match[0].length
                });
            }
        }
    }

    return entities.filter(e => e.confidence >= confidence);
}

export async function GET() {
    return json({
        message: 'NLP Entity Extraction API',
        endpoints: {
            POST: 'Extract entities from text'
        },
        usage: {
            text: 'Text to analyze (required)',
            entityTypes: 'Array of entity types to extract (optional)',
            confidence: 'Minimum confidence threshold (optional, default: 0.7)'
        },
        supportedEntityTypes: [
            'PERSON', 'ORGANIZATION', 'LOCATION', 'DATE', 'CRIME', 'LEGAL_TERM'
        ],
        environment: IS_PRODUCTION ? 'production (Gemini)' : 'development (Local LLM + Rule-based)'
    });
}
