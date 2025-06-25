
// Mock NLP client for now
// In a real application, this would make API calls to a Python NLP microservice

export const nlpClient = {
  async analyzeCaseDescription(description: string, caseId?: string) {
    console.log(`Analyzing description for case ${caseId}:`, description);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      entities: [
        { value: 'theft', type: 'crime' },
        { value: 'downtown', type: 'location' },
      ],
      relatedCases: [
        { caseId: 'CASE-002', similarity: 0.8, relationshipType: 'similar' },
        { caseId: 'CASE-003', similarity: 0.6, relationshipType: 'related' },
      ],
      sentiment: 'negative',
      summary: 'A summary of the case description.',
    };
  },

  async getCompletion(text: string) {
    console.log('Getting completion for text:', text);
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      suggestion: `${text} and then...`,
    };
  }
};
