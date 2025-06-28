import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { cases, criminals, statutes, users, evidence, reports, citationPoints, canvasStates } from '$lib/server/db/schema';

// Core database types
export type Case = InferSelectModel<typeof cases>;
export type NewCase = InferInsertModel<typeof cases>;

export type Criminal = InferSelectModel<typeof criminals>;
export type NewCriminal = InferInsertModel<typeof criminals>;

export type Statute = InferSelectModel<typeof statutes>;
export type NewStatute = InferInsertModel<typeof statutes>;

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Evidence = InferSelectModel<typeof evidence>;
export type NewEvidence = InferInsertModel<typeof evidence>;

// Enhanced Report Builder types
export type Report = InferSelectModel<typeof reports>;
export type NewReport = InferInsertModel<typeof reports>;

export type CitationPoint = InferSelectModel<typeof citationPoints>;
export type NewCitationPoint = InferInsertModel<typeof citationPoints>;

export type CanvasState = InferSelectModel<typeof canvasStates>;
export type NewCanvasState = InferInsertModel<typeof canvasStates>;

// Type for the user object returned by Auth.js session
export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
};

// Extended Case type with Case Books functionality
export interface CaseWithBooks extends Case {
  reports?: Report[];
  books?: Book[];
  citationPoints?: CitationPoint[];
}

// Case Book interface - contains multiple reports and citations
export interface Book {
  id: string;
  title: string;
  description?: string;
  caseId: string;
  reports: Report[];
  citationPoints: CitationPoint[];
  metadata: {
    tags: string[];
    category: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    confidentialityLevel: 'public' | 'restricted' | 'confidential' | 'top-secret';
    jurisdiction: string;
    createdDate: string;
    lastModified: string;
    completionStatus: 'draft' | 'review' | 'final' | 'archived';
  };
  aiSummary?: string;
  aiTags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Report Editor types
export interface ReportSection {
  id: string;
  title: string;
  content: string; // HTML content from contenteditable
  order: number;
  type: 'text' | 'evidence' | 'citation' | 'canvas';
  metadata?: {
    citations: string[]; // CitationPoint IDs
    evidenceRefs: string[]; // Evidence IDs
    canvasStateId?: string; // CanvasState ID if type is 'canvas'
  };
}

export interface ReportWithSections extends Report {
  sections: ReportSection[];
  citationPoints: CitationPoint[];
  canvasState?: CanvasState;
}

// AI Integration types
export interface AIAnalysis {
  id: string;
  reportId: string;
  analysisType: 'summary' | 'keyword_extraction' | 'sentiment' | 'citation_suggestion' | 'legal_precedent';
  result: {
    content: string;
    confidence: number;
    metadata: Record<string, any>;
  };
  timestamp: Date;
}

export interface CitationSuggestion {
  id: string;
  text: string;
  relevanceScore: number;
  source: CitationPoint;
  context: string;
  reasoning: string;
}

// Fabric.js Canvas types
export interface CanvasObject {
  id: string;
  type: 'text' | 'image' | 'arrow' | 'shape' | 'highlight' | 'evidence-marker';
  properties: Record<string, any>; // Fabric.js object properties
  metadata?: {
    evidenceId?: string;
    citationId?: string;
    annotations?: string[];
  };
}

export interface CanvasStateData {
  objects: CanvasObject[];
  background?: string;
  dimensions: {
    width: number;
    height: number;
  };
  viewport: {
    zoom: number;
    panX: number;
    panY: number;
  };
  metadata: {
    title?: string;
    description?: string;
    tags: string[];
    evidenceIds: string[];
    citationIds: string[];
  };
}

// Search and filtering types
export interface SearchFilters {
  query?: string;
  caseId?: string;
  reportType?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  jurisdiction?: string;
  confidentialityLevel?: string[];
  status?: string[];
}

export interface SearchResult {
  id: string;
  type: 'report' | 'citation' | 'evidence' | 'case';
  title: string;
  excerpt: string;
  relevanceScore: number;
  metadata: Record<string, any>;
  highlights: string[];
}

// Export types
export interface ExportOptions {
  format: 'pdf' | 'docx' | 'html' | 'json';
  includeCanvases: boolean;
  includeCitations: boolean;
  includeMetadata: boolean;
  watermark?: string;
  headerFooter?: {
    header: string;
    footer: string;
  };
}

export interface ExportResult {
  success: boolean;
  downloadUrl?: string;
  error?: string;
  metadata: {
    fileSize: number;
    pageCount?: number;
    generatedAt: Date;
  };
}

// Legacy support for Loki.js (offline/local storage)
export interface LegacyCitationPoint {
  id: string;
  text: string;
  source: string;
  page?: number;
  context: string;
  tags: string[];
  caseId?: string;
  reportId?: string;
  type: 'statute' | 'case_law' | 'evidence' | 'expert_opinion' | 'testimony';
  aiSummary?: string;
  relevanceScore?: number;
  createdAt: string; // ISO string for Loki.js compatibility
  updatedAt: string; // ISO string for Loki.js compatibility
}

// UI State types
export interface EditorState {
  activeReportId?: string;
  activeCanvasId?: string;
  selectedCitations: string[];
  clipboardContent?: {
    type: 'text' | 'citation' | 'canvas-object';
    data: any;
  };
  autoSaveEnabled: boolean;
  lastSaved?: Date;
  isDirty: boolean;
}

export interface SidebarState {
  activeTab: 'citations' | 'evidence' | 'ai-suggestions' | 'canvas-tools';
  citationFilters: {
    type?: string;
    tags?: string[];
    searchQuery?: string;
  };
  collapsed: boolean;
}

// Real-time collaboration types (future feature)
export interface CollaborationState {
  activeUsers: {
    userId: string;
    userName: string;
    cursor?: {
      x: number;
      y: number;
    };
    selection?: {
      reportId: string;
      sectionId: string;
      range: {
        start: number;
        end: number;
      };
    };
  }[];
  changes: {
    id: string;
    userId: string;
    type: 'text' | 'canvas' | 'citation';
    timestamp: Date;
    data: any;
  }[];
}
