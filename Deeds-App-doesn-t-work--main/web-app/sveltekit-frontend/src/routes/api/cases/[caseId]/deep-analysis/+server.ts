import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db/index';
import { cases, evidence, statutes } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// GBNF Grammar for structured legal analysis output
const LEGAL_ANALYSIS_GRAMMAR = `
root ::= analysis
analysis ::= "{" ws "\"analysis\":" ws legal_analysis ws "," ws "\"confidence\":" ws confidence ws "," ws "\"key_findings\":" ws key_findings ws "," ws "\"recommendations\":" ws recommendations ws "}"
legal_analysis ::= "\"" analysis_text "\""
analysis_text ::= [^"]*
confidence ::= number
key_findings ::= "[" ws (finding_item (ws "," ws finding_item)*)? ws "]"
finding_item ::= "\"" [^"]* "\""
recommendations ::= "[" ws (rec_item (ws "," ws rec_item)*)? ws "]"
rec_item ::= "\"" [^"]* "\""
number ::= [0-9]+ ("." [0-9]+)?
ws ::= [ \\t\\n]*
`;

export const POST: RequestHandler = async ({ params, request }) => {
    try {
        const { caseId } = params;
        const requestData = await request.json();
        const { evidenceIds, statuteIds, analysisType = 'comprehensive' } = requestData;        // Validate case exists
        const caseResult = await db.select().from(cases).where(eq(cases.id, caseId as string)).limit(1);
        if (caseResult.length === 0) {
            throw error(404, 'Case not found');
        }

        const case_data = caseResult[0];        // Fetch evidence if specified
        let evidenceData: any[] = [];
        if (evidenceIds && evidenceIds.length > 0) {
            evidenceData = await db.select()
                .from(evidence)
                .where(eq(evidence.caseId, caseId as string));
        }

        // Fetch relevant statutes if specified
        let statuteData: any[] = [];
        if (statuteIds && statuteIds.length > 0) {
            statuteData = await db.select()
                .from(statutes)
                .where(eq(statutes.id, statuteIds[0])); // Simplified for now
        }

        // Prepare context for analysis
        const context = {
            case: {
                title: case_data.title,
                description: case_data.description,
                status: case_data.status,
                priority: case_data.priority
            },            evidence: evidenceData.map((e: any) => ({
                id: e.id,
                title: e.title,
                fileType: e.fileType,
                description: e.description
            })),            statutes: statuteData.map((s: any) => ({
                id: s.id,
                title: s.title,
                fullText: s.fullText,
                sectionNumber: s.sectionNumber
            }))
        };

        // Prepare prompts for different LLM services
        const basePrompt = `Analyze the following legal case with evidence and applicable statutes. Provide a comprehensive analysis including confidence level, key findings, and recommendations.

Case Details:
Title: ${case_data.title}
Description: ${case_data.description}
Status: ${case_data.status}
Priority: ${case_data.priority}

Evidence Files: ${evidenceData.length} items
Relevant Statutes: ${statuteData.length} items

Please provide a detailed legal analysis focusing on:
1. Case strengths and weaknesses
2. Evidence evaluation
3. Statutory compliance
4. Recommended next steps
`;

        // Call multiple LLM services in parallel
        const [openaiResult, localLlmResult] = await Promise.allSettled([
            callOpenAI(basePrompt, context),
            callLocalLLM(basePrompt, context, LEGAL_ANALYSIS_GRAMMAR)
        ]);

        // Process results
        const results = {
            timestamp: new Date().toISOString(),
            case_id: parseInt(caseId as string),
            analysis_type: analysisType,
            results: {
                openai: openaiResult.status === 'fulfilled' ? openaiResult.value : { error: 'OpenAI service unavailable' },
                local_llm: localLlmResult.status === 'fulfilled' ? localLlmResult.value : { error: 'Local LLM service unavailable' }
            },
            context: {
                evidence_count: evidenceData.length,
                statute_count: statuteData.length,
                case_status: case_data.status
            }
        };

        return json(results);

    } catch (err) {
        console.error('Deep analysis error:', err);
        throw error(500, 'Failed to perform deep analysis');
    }
};

async function callOpenAI(prompt: string, context: any) {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
        return { error: 'OpenAI API key not configured' };
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert legal analyst. Provide detailed, structured analysis of legal cases.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1500,
                temperature: 0.3
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        return {
            service: 'openai',
            model: 'gpt-4',
            response: data.choices[0].message.content,
            tokens_used: data.usage?.total_tokens || 0,
            raw_response: data
        };
    } catch (err) {
        return {
            service: 'openai',
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }
}

async function callLocalLLM(prompt: string, context: any, grammar: string) {
    const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:8000';
    
    try {
        const response = await fetch(`${NLP_SERVICE_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt,
                max_tokens: 1000,
                temperature: 0.3,
                context: JSON.stringify(context),
                grammar: grammar  // Send GBNF grammar for structured output
            })
        });

        if (!response.ok) {
            throw new Error(`Local LLM service error: ${response.status}`);
        }

        const data = await response.json();
        
        // Try to parse the response as JSON if grammar was used
        let structured_response = null;
        let parsing_error = null;
        
        if (data.grammar_used) {
            try {
                structured_response = JSON.parse(data.response);
            } catch (parseErr) {
                parsing_error = parseErr instanceof Error ? parseErr.message : 'JSON parsing failed';
            }
        }

        return {
            service: 'local_llm',
            model: data.model || 'unknown',
            response: data.response,
            structured_response,
            parsing_error,
            tokens_used: data.tokens_used || 0,
            processing_time: data.processing_time_seconds || 0,
            grammar_used: data.grammar_used || false,
            raw_response: data
        };
    } catch (err) {
        return {
            service: 'local_llm',
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }
}
