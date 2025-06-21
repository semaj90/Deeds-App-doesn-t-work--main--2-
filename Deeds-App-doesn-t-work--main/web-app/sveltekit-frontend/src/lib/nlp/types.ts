// Client-side types for NLP analysis
// These are the same types as in the server analyzer but without database dependencies

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
  statuteId: string;
  relevance: number;
  reasoning: string;
  sections: string[];
}

export interface RelatedCase {
  caseId: string;
  similarity: number;
  relationshipType: 'similar' | 'related' | 'duplicate';
  sharedEntities: string[];
  reasoning: string;
}

export interface AnalysisSuggestion {
  type: 'merge_cases' | 'add_evidence' | 'legal_research' | 'follow_up' | 'template';
  title: string;
  description: string;
  actionData: any;
  priority: 'low' | 'medium' | 'high';
}
