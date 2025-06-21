import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { cases, caseRelationships, caseRelationshipFeedback } from '$lib/server/db/schema-new'; // Use unified schema
import { cache } from '$lib/server/cache/cache';
import { eq, and, desc, sql } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

const LLM_SERVICE_URL = env.LLM_SERVICE_URL;
const GEMINI_API_KEY = env.GEMINI_API_KEY;
const IS_PRODUCTION = env.NODE_ENV === 'production';

export async function GET({ params }: { params: { caseId: string } }) {
    try {
        const { caseId } = params;
        
        if (!caseId) {
            return json({ error: 'Case ID is required' }, { status: 400 });
        }

        const cacheKey = `cases:${caseId}:related`;
        const cached = cache.get(cacheKey);
        if (cached) {
            return json(cached);
        }

        // Get related cases based on relationships and user feedback
        const relatedCases = await db
            .select({
                case: cases, // Select the entire case object
                relationship: caseRelationships, // Select the entire relationship object
                feedbackScore: sql<number>`COALESCE(AVG(${caseRelationshipFeedback.userScore}), 0)`,
                feedbackCount: sql<number>`COUNT(${caseRelationshipFeedback.id})` // Count feedback entries
            })
            .from(caseRelationships)
            .innerJoin(cases, eq(cases.id, caseRelationships.relatedCaseId))
            .leftJoin(
                caseRelationshipFeedback,
                and(
                    eq(caseRelationshipFeedback.parentCaseId, caseRelationships.parentCaseId),
                    eq(caseRelationshipFeedback.relatedCaseId, caseRelationships.relatedCaseId)
                )
            )
            .where(eq(caseRelationships.parentCaseId, caseId))
            .groupBy(cases.id, caseRelationships.id)
            .orderBy(desc(sql`(${caseRelationships.confidence} + COALESCE(AVG(${caseRelationshipFeedback.userScore}), 0) * 0.5)`));

        // Also get reverse relationships
        const reverseRelatedCases = await db
            .select({
                case: cases, // Select the entire case object
                relationship: caseRelationships, // Select the entire relationship object
                feedbackScore: sql<number>`COALESCE(AVG(${caseRelationshipFeedback.userScore}), 0)`,
                feedbackCount: sql<number>`COUNT(${caseRelationshipFeedback.id})` // Count feedback entries
            })
            .from(caseRelationships)
            .innerJoin(cases, eq(cases.id, caseRelationships.parentCaseId))
            .leftJoin(
                caseRelationshipFeedback,
                and(
                    eq(caseRelationshipFeedback.parentCaseId, caseRelationships.parentCaseId),
                    eq(caseRelationshipFeedback.relatedCaseId, caseRelationships.relatedCaseId)
                )
            )
            .where(eq(caseRelationships.relatedCaseId, caseId))
            .groupBy(cases.id, caseRelationships.id)
            .orderBy(desc(sql`(${caseRelationships.confidence} + COALESCE(AVG(${caseRelationshipFeedback.userScore}), 0) * 0.5)`));

        // Combine and deduplicate
        const allRelated = [...relatedCases, ...reverseRelatedCases]
            .filter((item, index, self) => 
                index === self.findIndex(t => t.case.id === item.case.id)
            );

        const result = {
            caseId,
            relatedCases: allRelated.map(item => ({
                ...item.case,
                relationshipType: item.relationship.relationshipType,
                confidence: item.relationship.confidence,
                aiAnalysis: item.relationship.aiAnalysis,
                userFeedbackScore: item.feedbackScore,
                userFeedbackCount: item.feedbackCount,
                adjustedScore: item.relationship.confidence + (item.feedbackScore * 0.5)
            })),
            totalCount: allRelated.length,
            timestamp: new Date().toISOString()
        };

        // Cache for 5 minutes
        cache.set(cacheKey, result, 300000, ['cases', 'relationships']);

        return json(result);

    } catch (error) {
        console.error('Error fetching related cases:', error);
        return json({
            error: 'Failed to fetch related cases',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function POST({ params, request }: { params: { caseId: string }, request: Request }) {
    try {
        const { caseId } = params;
        const body = await request.json();
        const { relatedCaseId, userId, action } = body;

        if (!caseId || !relatedCaseId || !userId) {
            return json({ 
                error: 'caseId, relatedCaseId, and userId are required' 
            }, { status: 400 });
        }

        if (action === 'analyze') {
            // Analyze relationship between two cases using AI
            const analysis = await analyzeCaseRelationship(caseId, relatedCaseId);
            return json(analysis);
        } else if (action === 'create') {
            // Create a new relationship
            const { relationshipType, description } = body;
              const newRelationship = await db.insert(caseRelationships).values({
                parentCaseId: caseId,
                relatedCaseId,
                relationshipType: relationshipType || 'related',
                confidence: '0.8', // Default confidence for manual relationships
                description,
                discoveredBy: 'user',
                createdBy: userId,
            }).returning();

            // Invalidate cache
            cache.delete(`cases:${caseId}:related`);
            cache.delete(`cases:${relatedCaseId}:related`);

            return json(newRelationship[0], { status: 201 });
        } else {
            return json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error) {
        console.error('Error in case relationships endpoint:', error);
        return json({
            error: 'Failed to process request',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

async function analyzeCaseRelationship(caseId1: string, caseId2: string) {
    try {
        // Fetch case data
        const case1 = await db.select().from(cases).where(eq(cases.id, caseId1)).limit(1);
        const case2 = await db.select().from(cases).where(eq(cases.id, caseId2)).limit(1);

        if (!case1[0] || !case2[0]) {
            throw new Error('One or both cases not found');
        }

        // Use AI to analyze similarity
        const analysis = await getAIRelationshipAnalysis(case1[0], case2[0]);
        
        return {
            case1: { id: case1[0].id, title: case1[0].title },
            case2: { id: case2[0].id, title: case2[0].title },
            ...analysis,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('Error analyzing case relationship:', error);
        throw error;
    }
}

async function getAIRelationshipAnalysis(case1: any, case2: any) {
    const prompt = `Analyze the relationship between these two legal cases and provide a JSON response:

CASE 1:
Title: ${case1.title}
Description: ${case1.description || 'No description available'}
Status: ${case1.status}

CASE 2:
Title: ${case2.title}
Description: ${case2.description || 'No description available'}
Status: ${case2.status}

Analyze and return JSON with:
{
  "similarity": 0.0-1.0 (confidence score),
  "relationshipType": "similar|related|duplicate|unrelated",
  "commonElements": ["list", "of", "common", "elements"],
  "differences": ["list", "of", "key", "differences"],
  "recommendation": "brief explanation",
  "confidence": 0.0-1.0
}`;

    try {
        if (IS_PRODUCTION && GEMINI_API_KEY) {
            return await analyzeWithGemini(prompt);
        } else if (LLM_SERVICE_URL) {
            return await analyzeWithLocalLLM(prompt);
        } else {
            return analyzeWithRuleBased(case1, case2);
        }
    } catch (error) {
        console.error('Error in AI analysis:', error);
        return analyzeWithRuleBased(case1, case2);
    }
}

async function analyzeWithGemini(prompt: string) {
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
                temperature: 0.3,
            }
        })
    });

    if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    return JSON.parse(responseText);
}

async function analyzeWithLocalLLM(prompt: string) {
    const response = await fetch(`${LLM_SERVICE_URL}/analyze-relationship`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
        throw new Error(`Local LLM service error: ${response.status}`);
    }

    const data = await response.json();
    return data.analysis;
}

function analyzeWithRuleBased(case1: any, case2: any) {
    // Simple rule-based analysis as fallback
    const title1 = case1.title.toLowerCase();
    const title2 = case2.title.toLowerCase();
    const desc1 = (case1.description || '').toLowerCase();
    const desc2 = (case2.description || '').toLowerCase();

    // Calculate similarity based on common words
    const words1 = new Set([...title1.split(/\s+/), ...desc1.split(/\s+/)]);
    const words2 = new Set([...title2.split(/\s+/), ...desc2.split(/\s+/)]);
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    const similarity = intersection.size / union.size;

    return {
        similarity,
        relationshipType: similarity > 0.7 ? 'similar' : similarity > 0.4 ? 'related' : 'unrelated',
        commonElements: Array.from(intersection).slice(0, 5),
        differences: ['Analysis requires AI service'],
        recommendation: `Cases appear ${similarity > 0.5 ? 'related' : 'unrelated'} based on textual similarity`,
        confidence: 0.6
    };
}
