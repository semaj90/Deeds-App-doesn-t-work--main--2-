// Client-side NLP Analyzer interface
export interface CaseAnalysis {
  entities: ExtractedEntity[];
  predictions: CasePrediction;
  relatedLaws: RelatedLaw[];
  relatedCases: RelatedCase[];
  embedding: number[];
  confidence: number;
  sentiment: number;
  suggestions: AnalysisSuggestion[];
}

export interface ExtractedEntity {
  type: 'person' | 'location' | 'crime' | 'date' | 'organization' | 'evidence';
  value: string;
  confidence: number;
  context?: string;
}

export interface CasePrediction {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  expectedOutcome: string;
  confidence: number;
  reasoning: string[];
}

export interface RelatedLaw {
  code: string;
  section: string;
  description: string;
  relevanceScore: number;
}

export interface RelatedCase {
  id: string;
  title: string;
  outcome: string;
  similarity: number;
  reasoning: string;
}

export interface AnalysisSuggestion {
  type: 'evidence' | 'charge' | 'strategy' | 'witness' | 'precedent';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
}

// Client-side analyzer that makes API calls instead of direct DB access
export class PredictiveAnalyzer {
  async analyzeCaseDescription(description: string, caseId?: string): Promise<CaseAnalysis> {
    try {
      const response = await fetch('/api/nlp/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, caseId })
      });
      
      if (!response.ok) {
        throw new Error('Analysis failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error analyzing case description:', error);
      // Return mock data as fallback
      return {
        entities: [],
        predictions: {
          category: 'General',
          severity: 'medium',
          expectedOutcome: 'Pending analysis',
          confidence: 0.5,
          reasoning: []
        },
        relatedLaws: [],
        relatedCases: [],
        embedding: [],
        confidence: 0.5,
        sentiment: 0,
        suggestions: []
      };
    }
  }

  async getRecentCases(userId: string, limit: number = 5) {
    try {
      const response = await fetch(`/api/cases/recent?userId=${userId}&limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch recent cases');
      return await response.json();
    } catch (error) {
      console.error('Error fetching recent cases:', error);
      return [];
    }
  }

  async getSavedStatements(category: string, userId: string) {
    try {
      const response = await fetch(`/api/statements/saved?category=${category}&userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch saved statements');
      return await response.json();
    } catch (error) {
      console.error('Error fetching saved statements:', error);
      return [];
    }
  }

  async findRelatedCases(description: string, excludeCaseId?: string): Promise<RelatedCase[]> {
    try {
      const response = await fetch('/api/cases/related', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, excludeCaseId })
      });
      
      if (!response.ok) throw new Error('Failed to find related cases');
      return await response.json();
    } catch (error) {
      console.error('Error finding related cases:', error);
      return [];
    }
  }
}

export const predictiveAnalyzer = new PredictiveAnalyzer();
