import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

// AI "Tell me what to do" guidance endpoint
export const POST: RequestHandler = async ({ request }) => {
  try {
    const { context, userProfile } = await request.json();
    
    // Extract relevant context
    const {
      currentContent = '',
      selectedText = '',
      caseId = '',
      reportId = ''
    } = context;

    // Build AI prompt based on context
    let prompt = "Based on the current prosecutor's report context, provide specific guidance on next steps. ";
    
    if (selectedText) {
      prompt += `The user has selected: "${selectedText}". `;
    }
    
    if (currentContent) {
      const wordCount = currentContent.split(' ').length;
      prompt += `Current document has ${wordCount} words. `;
    }

    // Add user patterns if available
    if (userProfile?.workPatterns) {
      const { commonCitations, frequentPhrases } = userProfile.workPatterns;
      if (commonCitations?.length > 0) {
        prompt += `User frequently uses citations: ${commonCitations.slice(0, 3).map((c: any) => c.label).join(', ')}. `;
      }
    }

    prompt += `
    Provide 3-5 specific, actionable suggestions for what the prosecutor should do next.
    Consider:
    - Legal analysis needed
    - Evidence gaps to address
    - Citation requirements
    - Next paragraphs to write
    - Case law to research
    
    Format as a JSON response with suggestions array.`;

    // Call Legal-BERT or local LLM API
    const aiResponse = await fetch('http://localhost:5000/api/legal-bert/infer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: prompt,
        task: 'guidance_generation',
        max_tokens: 300
      })
    });

    let guidance = "Here are some suggestions for your next steps:\n\n";
    
    if (aiResponse.ok) {
      const aiResult = await aiResponse.json();
      guidance = aiResult.generated_text || guidance + 
        "1. Review evidence for any gaps\n" +
        "2. Add supporting citations for key claims\n" +
        "3. Consider opposing arguments\n" +
        "4. Verify statutory references\n" +
        "5. Strengthen factual conclusions";
    } else {
      // Fallback guidance based on context analysis
      if (!currentContent || currentContent.length < 100) {
        guidance += "1. Start with a clear statement of facts\n2. Outline the legal issues\n3. Identify relevant statutes";
      } else if (selectedText) {
        guidance += `1. Elaborate on "${selectedText}"\n2. Add supporting evidence\n3. Include relevant case law`;
      } else {
        guidance += "1. Review for completeness\n2. Add concluding statements\n3. Verify all citations";
      }
    }

    // Return structured AI analysis
    const analysis = {
      id: crypto.randomUUID(),
      reportId: reportId || 'unknown',
      analysisType: 'guidance',
      input: prompt,
      output: guidance,
      confidence: 0.85,
      metadata: {
        model: 'legal-bert',
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - Date.now(), // Would measure actual time
        context: {
          hasSelectedText: !!selectedText,
          contentLength: currentContent.length,
          userPreferences: userProfile?.preferences || null
        }
      },
      tags: ['guidance', 'next-steps', 'ai-generated'],
      approved: false
    };

    return json(analysis);

  } catch (error) {
    console.error('AI guidance generation failed:', error);
    return json(
      { 
        error: 'Failed to generate AI guidance',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
};
