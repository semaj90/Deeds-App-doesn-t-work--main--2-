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

// === CLIENT-SAFE SCHEMA TYPES ===
// These are inferred from the shared monorepo schema

import type { statutes, cases, crimes, criminals, evidence, users } from './server/db/shared-db';

export type Statute = typeof statutes.$inferSelect;
export type NewStatute = typeof statutes.$inferInsert;

export type Case = typeof cases.$inferSelect;
export type NewCase = typeof cases.$inferInsert;

export type Crime = typeof crimes.$inferSelect;
export type NewCrime = typeof crimes.$inferInsert;

export type Criminal = typeof criminals.$inferSelect;
export type NewCriminal = typeof criminals.$inferInsert;

export type Evidence = typeof evidence.$inferSelect;
export type NewEvidence = typeof evidence.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
