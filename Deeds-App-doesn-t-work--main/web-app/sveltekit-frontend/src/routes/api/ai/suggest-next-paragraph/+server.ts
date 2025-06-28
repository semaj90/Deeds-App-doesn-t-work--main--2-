import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

// AI next paragraph suggestions endpoint
export const POST: RequestHandler = async ({ request }) => {
  try {
    const { currentContent, cursorPosition, caseId, reportId, userProfile } = await request.json();
    
    // Extract context around cursor position
    const beforeCursor = currentContent.substring(0, cursorPosition);
    const afterCursor = currentContent.substring(cursorPosition);
    
    // Analyze current context
    const lastParagraph = beforeCursor.split('\n').pop() || '';
    const nextParagraph = afterCursor.split('\n')[0] || '';
    
    // Build AI prompt for next paragraph suggestion
    let prompt = `As a legal writing assistant, suggest the next paragraph for this prosecutor's report. 

Current context:
Previous text: "${beforeCursor.slice(-200)}"
Current position context: "${lastParagraph}"
Following text: "${nextParagraph}"

`;

    // Add user writing patterns if available
    if (userProfile?.workPatterns) {
      const { writingStyle, avgWordsPerParagraph, frequentPhrases } = userProfile.workPatterns;
      if (writingStyle) {
        prompt += `User's writing style: ${writingStyle}. `;
      }
      if (avgWordsPerParagraph) {
        prompt += `Target paragraph length: approximately ${avgWordsPerParagraph} words. `;
      }
      if (frequentPhrases?.length > 0) {
        prompt += `User commonly uses phrases: ${frequentPhrases.slice(0, 3).join(', ')}. `;
      }
    }

    prompt += `
Generate 3 different paragraph suggestions that could logically follow. Each should:
1. Flow naturally from the previous content
2. Advance the legal argument
3. Be appropriate for a prosecutor's report
4. Include specific legal reasoning

Format as JSON with array of suggestions.`;

    // Call Legal-BERT or local LLM API
    const aiResponse = await fetch('http://localhost:5000/api/legal-bert/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        max_tokens: 400,
        num_suggestions: 3,
        temperature: 0.7
      })
    });

    let suggestions: string[] = [];
    
    if (aiResponse.ok) {
      const aiResult = await aiResponse.json();
      suggestions = aiResult.suggestions || aiResult.generated_text?.split('\n\n').slice(0, 3) || [];
    }
    
    // Fallback suggestions based on content analysis
    if (suggestions.length === 0) {
      if (lastParagraph.includes('evidence')) {
        suggestions = [
          "The evidence clearly demonstrates the defendant's intent to commit the alleged offense. Based on the witness testimony and physical evidence collected at the scene...",
          "Furthermore, this evidence establishes beyond a reasonable doubt that the defendant had both the opportunity and motive to carry out the criminal act...",
          "In analyzing this evidence, it becomes apparent that the defendant's actions were deliberate and calculated, not the result of accident or mistake..."
        ];
      } else if (lastParagraph.includes('statute') || lastParagraph.includes('law')) {
        suggestions = [
          "This statute has been consistently interpreted by the courts to encompass situations precisely like the one presented in this case...",
          "The legislative intent behind this provision was clearly to address the type of conduct exhibited by the defendant...",
          "Precedent established in similar cases supports the application of this statute to the defendant's actions..."
        ];
      } else {
        suggestions = [
          "The facts of this case establish a clear pattern of criminal behavior that warrants prosecution under the applicable statutes...",
          "Based on the evidence presented, there is probable cause to believe that the defendant committed the offense as charged...",
          "The circumstances surrounding this incident demonstrate the defendant's culpability and the strength of the prosecution's case..."
        ];
      }
    }

    // Filter and enhance suggestions
    const enhancedSuggestions = suggestions
      .filter(s => s && s.length > 20)
      .slice(0, 3)
      .map(suggestion => {
        // Ensure suggestions are properly formatted
        if (!suggestion.endsWith('.')) {
          suggestion += '.';
        }
        return suggestion;
      });

    return json({
      suggestions: enhancedSuggestions,
      metadata: {
        contextLength: currentContent.length,
        cursorPosition,
        model: 'legal-bert',
        timestamp: new Date().toISOString(),
        confidence: aiResponse.ok ? 0.85 : 0.65
      }
    });

  } catch (error) {
    console.error('Next paragraph suggestion failed:', error);
    return json(
      { 
        error: 'Failed to generate paragraph suggestions',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
};
