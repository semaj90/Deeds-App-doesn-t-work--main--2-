// Client-side NLP API client
// This provides the same interface as the server analyzer but uses API calls

import type { CaseAnalysis } from './types.js';

export class NLPClient {
  private baseUrl = '/api/nlp';

  async analyzeCaseDescription(description: string, caseId?: string): Promise<CaseAnalysis> {
    try {
      const response = await fetch(`${this.baseUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          caseId
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('NLP analysis failed:', error);
      throw error;
    }
  }

  async findRelatedCases(description: string, caseId?: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/related-cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          caseId
        })
      });

      if (!response.ok) {
        throw new Error(`Related cases search failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Related cases search failed:', error);
      throw error;
    }
  }

  async generateCaseSuggestions(caseId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/suggestions/${caseId}`);

      if (!response.ok) {
        throw new Error(`Suggestions generation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Suggestions generation failed:', error);
      throw error;
    }
  }

  async suggestTags(text: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/suggest-tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error(`Tag suggestion failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.tags || [];
    } catch (error) {
      console.error('Tag suggestion failed:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const nlpClient = new NLPClient();
