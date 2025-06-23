import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { message, history } = await request.json();
    
    if (!message || typeof message !== 'string') {
      return json({
        success: false,
        error: 'Invalid message'
      }, { status: 400 });
    }
    
    // Mock AI response for now
    // In production, this would integrate with an actual AI service
    const aiResponses = [
      "Based on legal precedent, probable cause requires a reasonable belief that a crime has been committed and that specific evidence will be found in the location to be searched.",
      "Evidence documentation should follow chain of custody procedures: 1) Photograph in place, 2) Collect with proper tools, 3) Tag and seal, 4) Document time, location, and personnel involved.",
      "Search warrants require: 1) Probable cause, 2) Specific description of place and items, 3) Oath or affirmation, 4) Neutral magistrate approval. Exceptions include exigent circumstances, consent, and search incident to arrest.",
      "Miranda rights must be read when: 1) Person is in custody AND 2) Interrogation will occur. Rights include: right to remain silent, right to attorney, and warning that statements can be used in court.",
      "For the legal issue you've described, I recommend consulting the relevant statutes and recent case law. Consider documenting all evidence thoroughly and following established protocols.",
      "This appears to be a complex legal matter. I suggest gathering all relevant documentation and consulting with legal counsel for specific guidance on your jurisdiction's requirements."
    ];
    
    // Simple response selection based on keywords
    let response = "I understand your question. Could you provide more specific details about the legal matter you're inquiring about?";
    
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('probable cause')) {
      response = aiResponses[0];
    } else if (lowerMessage.includes('evidence') || lowerMessage.includes('document')) {
      response = aiResponses[1];
    } else if (lowerMessage.includes('search warrant') || lowerMessage.includes('warrant')) {
      response = aiResponses[2];
    } else if (lowerMessage.includes('miranda') || lowerMessage.includes('rights')) {
      response = aiResponses[3];
    } else if (lowerMessage.includes('case') || lowerMessage.includes('legal')) {
      response = aiResponses[4];
    } else {
      response = aiResponses[5];
    }
    
    return json({
      success: true,
      response,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('AI Chat API error:', error);
    return json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
};
