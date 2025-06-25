
export interface CaseAnalysis {
    entities: Entity[];
    relatedCases: RelatedCase[];
    sentiment: string;
    summary: string;
  }
  
  export interface Entity {
    value: string;
    type: string;
  }
  
  export interface RelatedCase {
    caseId: string;
    similarity: number;
    relationshipType: string;
  }
