import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

// AI hover summary endpoint for citations
export const POST: RequestHandler = async ({ request }) => {
  try {
    const { citation, context } = await request.json();
    
    // Build prompt for hover summary generation
    const prompt = `Generate a concise summary for this legal citation in the context of a prosecutor's report:

Citation: ${citation.label} - ${citation.content}
Source Type: ${citation.sourceType}
Context: ${context || 'hover_preview'}

Provide a 2-3 sentence summary that explains:
1. What this citation establishes legally
2. Why it's relevant to prosecution
3. Key legal principle involved

Keep it concise and prosecutor-focused.`;

    // Call Legal-BERT for summary generation
    const aiResponse = await fetch('http://localhost:5000/api/legal-bert/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: citation.content,
        prompt,
        max_tokens: 150,
        focus: 'legal_significance'
      })
    });

    let summary = '';
    
    if (aiResponse.ok) {
      const aiResult = await aiResponse.json();
      summary = aiResult.summary || aiResult.generated_text || '';
    }
    
    // Fallback summary generation
    if (!summary) {
      summary = generateFallbackSummary(citation);
    }

    return json({
      summary,
      citationId: citation.id,
      metadata: {
        model: 'legal-bert',
        timestamp: new Date().toISOString(),
        confidence: aiResponse.ok ? 0.8 : 0.6,
        context
      }
    });

  } catch (error) {
    console.error('Hover summary generation failed:', error);
    return json(
      { 
        error: 'Failed to generate hover summary',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
};

// Helper function to generate fallback summaries
function generateFallbackSummary(citation: any): string {
  const { sourceType, content, label } = citation;
  
  switch (sourceType) {
    case 'case_law':
      return `This case law citation ${label} establishes important legal precedent. It provides judicial interpretation that can strengthen the prosecution's argument. The holding is binding and directly applicable to similar factual circumstances.`;
      
    case 'statute':
      return `This statutory citation ${label} defines the legal framework governing this case. It establishes the elements required for prosecution and provides the legal basis for the charges. Understanding this statute is crucial for building a strong case.`;
      
    case 'constitutional':
      return `This constitutional provision ${label} establishes fundamental legal principles. It provides the highest level of legal authority and sets boundaries for prosecution. Constitutional citations carry significant weight in legal arguments.`;
      
    case 'evidence':
      return `This evidence citation ${label} supports key facts in the case. It provides factual foundation for legal arguments and helps establish elements of the charged offense. Proper evidence citation is essential for credibility.`;
      
    case 'expert':
      return `This expert citation ${label} provides specialized knowledge relevant to the case. Expert opinions can clarify complex issues and strengthen the prosecution's position. Such citations add credibility to technical arguments.`;
      
    default:
      return `This citation ${label} provides important support for the legal argument. It adds authority to the prosecution's position and should be properly integrated into the overall case strategy.`;
  }
}
