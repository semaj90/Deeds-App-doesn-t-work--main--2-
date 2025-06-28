import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();
		const imageFile = formData.get('image') as File;
		const context = formData.get('context') as string;
		const analysisType = formData.get('analysisType') as string || 'comprehensive';

		if (!imageFile) {
			return json({ error: 'No image file provided' }, { status: 400 });
		}

		// Convert image to base64 for analysis
		const imageBuffer = await imageFile.arrayBuffer();
		const imageBase64 = Buffer.from(imageBuffer).toString('base64');

		let analysisResult;

		try {
			// Try AI-powered analysis first
			const analysisPayload = {
				image: imageBase64,
				context: context || '',
				analysisType,
				options: {
					detectFaces: true,
					detectObjects: true,
					extractText: true,
					enhanceQuality: true
				}
			};

			// In a real implementation, this would call your AI service
			const aiResponse = await fetch('http://localhost:8000/api/analyze-evidence', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(analysisPayload)
			});

			if (aiResponse.ok) {
				analysisResult = await aiResponse.json();
			} else {
				throw new Error('AI service unavailable');
			}
		} catch (error) {
			// Fallback analysis
			analysisResult = await performFallbackAnalysis(imageFile, imageBase64);
		}

		// Structure the evidence analysis result
		const evidenceAnalysis = {
			id: `evidence_${Date.now()}`,
			imageUrl: `data:${imageFile.type};base64,${imageBase64}`,
			filename: imageFile.name,
			filesize: imageFile.size,
			mimetype: imageFile.type,
			analysis: analysisResult,
			confidence: analysisResult.confidence || 0.7,
			timestamp: new Date().toISOString(),
			metadata: {
				analysisType,
				context: context || '',
				processingTime: Date.now() - Date.now(), // Would be calculated properly
				model: analysisResult.model || 'fallback'
			},
			tags: generateEvidenceTags(analysisResult),
			aiSummary: analysisResult.summary || generateEvidenceSummary(analysisResult),
			legalBertAnalysis: await performLegalBertAnalysis(analysisResult)
		};

		return json({ 
			success: true, 
			evidence: evidenceAnalysis,
			message: 'Evidence analysis completed successfully'
		});

	} catch (error) {
		console.error('Evidence analysis error:', error);
		return json({ 
			error: 'Failed to analyze evidence',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};

// Helper functions
async function performFallbackAnalysis(imageFile: File, imageBase64: string) {
	// Basic fallback analysis without AI
	return {
		objects: [],
		faces: [],
		text: '',
		quality: 'unknown',
		summary: `Basic analysis of ${imageFile.name}`,
		confidence: 0.5,
		model: 'fallback'
	};
}

function generateEvidenceTags(analysis: any): string[] {
	const tags: string[] = ['evidence'];
	
	if (analysis.faces && analysis.faces.length > 0) {
		tags.push('facial-evidence', 'person-identification');
	}
	
	if (analysis.objects && analysis.objects.length > 0) {
		tags.push('object-detection');
		analysis.objects.forEach((obj: any) => {
			if (obj.label && obj.confidence > 0.7) {
				tags.push(`object-${obj.label.toLowerCase()}`);
			}
		});
	}
	
	if (analysis.text && analysis.text.length > 0) {
		tags.push('text-extraction', 'document-evidence');
	}
	
	return [...new Set(tags)]; // Remove duplicates
}

function generateEvidenceSummary(analysis: any): string {
	const parts: string[] = [];
	
	if (analysis.faces && analysis.faces.length > 0) {
		parts.push(`${analysis.faces.length} face(s) detected`);
	}
	
	if (analysis.objects && analysis.objects.length > 0) {
		const highConfidenceObjects = analysis.objects.filter((obj: any) => obj.confidence > 0.7);
		if (highConfidenceObjects.length > 0) {
			parts.push(`${highConfidenceObjects.length} object(s) identified`);
		}
	}
	
	if (analysis.text && analysis.text.length > 0) {
		parts.push('Text content extracted');
	}
	
	return parts.length > 0 ? parts.join(', ') : 'Basic image analysis completed';
}

async function performLegalBertAnalysis(analysis: any): Promise<any> {
	// In a real implementation, this would use Legal-BERT to analyze legal relevance
	return {
		legalRelevance: 0.6,
		suggestedCategories: ['evidence', 'investigation'],
		confidence: 0.7,
		reasoning: 'Automated legal analysis pending advanced model integration'
	};
}
