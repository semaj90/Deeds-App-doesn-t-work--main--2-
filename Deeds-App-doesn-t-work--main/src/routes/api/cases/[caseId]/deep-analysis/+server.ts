import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db/index';
import { cases, evidence, statutes } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

// GBNF Grammar for structured legal analysis output
const LEGAL_ANALYSIS_GRAMMAR = `
root ::= analysis
analysis ::= "{" ws "\"analysis\":" ws legal_analysis ws "," ws "\"confidence\":" ws confidence ws "," ws "\"key_findings\":" ws key_findings ws "," ws "\"recommendations\":" ws recommendations ws "}"
legal_analysis ::= "\"\"\" analysis_text "\"\"\""
analysis_text ::= ([^\"] | "\\\"")*
confidence ::= number
key_findings ::= "[" ws (finding_item (ws "," ws finding_item)*)? ws "]"
finding_item ::= "\"\"\" [^\"]* "\"\"\""
recommendations ::= "[" ws (rec_item (ws "," ws rec_item)*)? ws "]"
rec_item ::= "\"\"\" [^\"]* "\"\"\""
number ::= [0-9]+ ("." [0-9]+)?
ws ::= [ \t\n]*
`;

export const POST: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return error(401, 'Unauthorized');
	}

	try {
		const caseIdStr = params.caseId;
		if (!caseIdStr) {
			return error(400, 'Case ID is required.');
		}
		const caseId = parseInt(caseIdStr, 10);
		if (isNaN(caseId)) {
			return error(400, 'Invalid Case ID format.');
		}

		const requestData = await request.json();
		const { evidenceIds, statuteIds, analysisType = 'comprehensive' } = requestData;

		// Validate case exists
		const caseResult = await db
			.select()
			.from(cases)
			.where(eq(cases.id, caseId))
			.limit(1);
		if (caseResult.length === 0) {
			return error(404, 'Case not found.');
		}

		// Fetch evidence content
		let evidenceContent = '';
		if (evidenceIds && Array.isArray(evidenceIds) && evidenceIds.length > 0) {
			const evidenceResults = await db
				.select({ content: evidence.content })
				.from(evidence)
				.where(inArray(evidence.id, evidenceIds));
			evidenceContent = evidenceResults.map((e: { content: string | null }) => e.content).join('\n\n');
		}

		// Fetch statute content
		let statuteContent = '';
		if (statuteIds && Array.isArray(statuteIds) && statuteIds.length > 0) {
			const statuteResults = await db
				.select({ fullText: statutes.fullText })
				.from(statutes)
				.where(inArray(statutes.id, statuteIds));
			statuteContent = statuteResults.map((s: { fullText: string | null }) => s.fullText).join('\n\n');
		}

		const context = `
Case Description: ${caseResult[0].description}

Evidence:
${evidenceContent}

Applicable Statutes:
${statuteContent}
        `;

		const llmServiceUrl = env.LLM_SERVICE_URL || 'http://localhost:5001';

		// Call the Python NLP service
		const response = await fetch(`${llmServiceUrl}/analyze`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				text: context,
				analysis_type: analysisType,
				gbnf_grammar: LEGAL_ANALYSIS_GRAMMAR,
				llm_backend: 'llama' // Or whichever backend is configured to use grammar
			})
		});

		if (!response.ok) {
			const errorBody = await response.text();
			console.error('LLM service error:', errorBody);
			return error(response.status, `Error from analysis service: ${errorBody}`);
		}

		const analysisResult = await response.json();

		// TODO: Potentially store the analysis result in the database or associate it with the case
		// For now, just return it to the client

		return json(analysisResult);
	} catch (err) {
		console.error('Deep analysis error:', err);
		const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
		return error(500, `Failed to perform deep analysis: ${errorMessage}`);
	}
};
