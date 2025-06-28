import { json } from '@sveltejs/kit';

export const POST = async ({ request }: any) => {
	try {
		const { text, context } = await request.json();

		if (!text || typeof text !== 'string') {
			return json({ error: 'Text is required' }, { status: 400 });
		}

		// Mock Legal-BERT analysis for now
		// In production, this would call a Python Flask API or local LLM
		const mockAnalysis = {
			id: crypto.randomUUID(),
			summary: `Legal analysis of: "${text.substring(0, 50)}..."`,
			tags: ['evidence', 'criminal_law', 'procedure'],
			confidence: 0.87,
			relevantStatutes: [
				'Federal Rules of Evidence Rule 401',
				'18 U.S.C. § 3161 (Speedy Trial Act)',
				'Brady v. Maryland (1963)'
			],
			evidenceType: determineEvidenceType(text),
			significance: calculateSignificance(text),
			recommendations: [
				'Verify chain of custody documentation',
				'Cross-reference with existing case precedents',
				'Consider potential constitutional challenges'
			],
			createdAt: new Date().toISOString()
		};

		return json({
			success: true,
			analysis: mockAnalysis
		});

	} catch (error) {
		console.error('Legal-BERT analysis error:', error);
		return json(
			{ error: 'Failed to analyze text with Legal-BERT' },
			{ status: 500 }
		);
	}
};

function determineEvidenceType(text: string): string {
	const lowerText = text.toLowerCase();
	
	if (lowerText.includes('witness') || lowerText.includes('testimony')) {
		return 'witness_testimony';
	} else if (lowerText.includes('document') || lowerText.includes('record')) {
		return 'documentary_evidence';
	} else if (lowerText.includes('forensic') || lowerText.includes('dna')) {
		return 'forensic_evidence';
	} else if (lowerText.includes('confession') || lowerText.includes('statement')) {
		return 'defendant_statement';
	} else {
		return 'general_evidence';
	}
}

function calculateSignificance(text: string): number {
	let score = 0.5; // Base significance
	
	const keywords = [
		'critical', 'crucial', 'key', 'important', 'vital',
		'murder', 'felony', 'conviction', 'guilty', 'evidence'
	];
	
	keywords.forEach(keyword => {
		if (text.toLowerCase().includes(keyword)) {
			score += 0.1;
		}
	});
	
	return Math.min(score, 1.0);
}
