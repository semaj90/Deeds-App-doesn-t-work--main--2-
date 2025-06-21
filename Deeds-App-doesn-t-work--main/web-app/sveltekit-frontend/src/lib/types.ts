export interface EvidenceFile {
  id: string;
  filename: string;
  fileName?: string; // alias for filename
  fileSize: number;
  fileType?: string; // derived from mimeType
  mimeType: string;
  filePath: string;
  duration?: number | null;
  uploadedAt: Date;
  processedAt?: Date | null;
  extractedText?: string | null;
  metadata?: Record<string, any>;
  tags?: string[];
  caseId?: string | null;
  evidenceId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EvidenceAnchorPoint {
  id: string;
  positionX: number;
  positionY: number;
  timestamp?: number | null;
  anchorType: 'object' | 'text' | 'audio_segment' | 'timeline_event' | 'custom';
  label: string;
  description?: string | null;
  confidence?: number;
  metadata?: Record<string, any>;
  evidenceFileId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CaseEvidenceSummary {
  id?: string;
  caseId: string;
  evidenceFileId?: string;
  summaryType?: string;
  title?: string;
  markdownContent?: string;
  plainTextContent?: string;
  keyFindings?: string[];
  confidence?: number;
  generatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  evidenceCount: number;
  totalFiles: number;
  categories: string[];
  timeline: Array<{
    date: Date;
    event: string;
    evidenceId: string;
  }>;
}

export interface EntityExtraction {
  type: string;
  text: string;
  confidence: number;
  startOffset?: number;
  endOffset?: number;
}

export interface NLPAnalysisResult {
  summary: string;
  entities: EntityExtraction[];
  keywords: string[];
  sentiment?: {
    score: number;
    label: string;
  };
  confidence: number;
  metadata?: Record<string, any>;
}
