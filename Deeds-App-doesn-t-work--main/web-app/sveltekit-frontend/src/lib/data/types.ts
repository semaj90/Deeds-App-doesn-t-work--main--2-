import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { cases, criminals, statutes, users, evidence, crimes } from '$lib/server/db/schema';

// --- Book type for Case Books feature, books are reports, user generated, look up best lightweight non cms, crud posts editor,
// cases have report generator, with persons of interests, evidence, previous cases, that can be stored into interactive report
// // for  generator reporter
// and or uploaded previous reports, books, attached to user. accounts {cases} id ---
// TODO: Implement backend support for books and link to cases, helps create a richer case context
// This type can be extended with more fields as needed for the UI for report // generation, case summaries, or other features that require book references.
// The Book type is currently minimal, focusing on essential fields like id, title, author,
// infinite page generator that creates blank pages to the case database, 
// that allows typing in the app, and with a "save button" some sort of auto-mated saving, with caching, ssr 
// and will be populated from the backend when available.


export type Book = {
  id: string;
  title: string;
  author?: string;
  description?: string;
  publishedAt?: string | Date;
  // Add more fields as needed
};

// --- Unified Case type with all UI/AI fields and books ---
export type Case = InferSelectModel<typeof cases> & {
  // AI/semantic fields
  aiSummary?: string | null;
  aiTags?: string[];
  dangerScore?: number;
  embedding?: number[];
  // UI/UX fields
  evidenceCount?: number;
  formattedDate?: string;
  timeAgo?: string;
  nlpInsights?: any;
  // Case books feature
  books?: Book[]; // TODO: Populate from backend when available
  // Advanced/related features
  relatedCases?: string[]; // TODO: Replace with RelatedCase[] if available
  // Add more as needed for UI completeness
};

export type NewCase = InferInsertModel<typeof cases>;

export type Criminal = Omit<InferSelectModel<typeof criminals>, 'name'> & {
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  address: string | null;
  email: string | null;
};
export type NewCriminal = Omit<InferInsertModel<typeof criminals>, 'name'> & {
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  address: string | null;
  email: string | null;
};

export type Statute = InferSelectModel<typeof statutes>;

export type Crime = InferSelectModel<typeof crimes>;

export type Evidence = InferSelectModel<typeof evidence>;

export type User = InferSelectModel<typeof users> & {
  username?: string;
  image?: string | null;
  profile?: { bio?: string } | Record<string, any>;
  role?: string | null;
};

// Type for the user object returned by Auth.js session
export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

// --- TODO: Add types for advanced AI/semantic features as needed ---

// --- Enhanced Report Builder Types ---
export type Report = {
  id: string;
  caseId: string;
  title: string;
  content: string; // HTML content from contenteditable
  citationPoints: CitationPoint[];
  canvasState?: CanvasState;
  aiAnalysis?: AIAnalysis;
  metadata: {
    wordCount?: number;
    lastSaved?: string;
    version?: number;
    template?: string;
  };
  createdAt: string | Date;
  updatedAt: string | Date;
  createdBy: string;
};

export type CitationPoint = {
  id: string;
  label: string; // e.g., "[1]", "[Smith v. State]"
  content: string; // The actual citation text
  sourceType: 'case_law' | 'statute' | 'evidence' | 'expert' | 'custom';
  sourceId?: string; // Reference to evidence, statute, etc.
  url?: string;
  page?: number;
  embedding?: number[]; // Vector embedding for semantic search
  tags: string[];
  caseId?: string;
  reportId?: string;
  createdAt: string | Date;
  synced: boolean; // For offline sync
};

export type CanvasState = {
  id: string;
  reportId: string;
  caseId: string;
  fabricJson: string; // Serialized Fabric.js canvas state
  imagePreview?: string; // Base64 data URL for thumbnail
  evidenceMarkers: EvidenceMarker[];
  annotations: CanvasAnnotation[];
  metadata: {
    width: number;
    height: number;
    zoom: number;
    lastModified: string;
  };
};

export type EvidenceMarker = {
  id: string;
  evidenceId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'image' | 'document' | 'annotation';
  label?: string;
};

export type CanvasAnnotation = {
  id: string;
  type: 'text' | 'arrow' | 'highlight' | 'drawing';
  data: any; // Flexible data for different annotation types
  position: { x: number; y: number };
  style?: any;
};

export type AIAnalysis = {
  id: string;
  reportId: string;
  analysisType: 'summary' | 'suggestions' | 'citations' | 'legal_issues' | 'evidence_gaps';
  input: string; // The text that was analyzed
  output: string; // AI-generated result
  confidence: number;
  metadata: {
    model: string; // e.g., 'legal-bert', 'gpt-4', 'local-llm'
    timestamp: string;
    processingTime: number;
    context?: any; // Additional context used
  };
  tags: string[];
  approved: boolean; // Whether user approved the suggestion
};

export type ReportTemplate = {
  id: string;
  name: string;
  description: string;
  category: 'discovery' | 'motion' | 'summary' | 'closing' | 'custom';
  content: string; // Template HTML
  citationTemplates: CitationPoint[];
  canvasTemplate?: Partial<CanvasState>;
  metadata: any;
};

export type UserHistory = {
  id: string;
  userId: string;
  action: 'report_created' | 'citation_added' | 'ai_suggestion_used' | 'export_pdf';
  entityId: string; // Report ID, Citation ID, etc.
  metadata: any;
  timestamp: string;
  embedding?: number[]; // For AI to understand user patterns
};

// --- Enhanced UI State Types ---
export type AutocompleteState = 'idle' | 'searching' | 'showing' | 'selected';

export type EditorState = {
  content: string;
  selection?: {
    start: number;
    end: number;
    text: string;
  };
  cursor?: {
    x: number;
    y: number;
  };
  autocomplete: {
    state: AutocompleteState;
    query: string;
    suggestions: CitationPoint[];
    selectedIndex: number;
  };
  ai: {
    isAnalyzing: boolean;
    lastAnalysis?: AIAnalysis;
    suggestions: string[];
  };
};

export type CitationSearchResult = {
  item: CitationPoint;
  score: number;
  matches: Array<{
    indices: [number, number];
    value: string;
    key: string;
  }>;
};

// --- Export Types ---
export type ExportFormat = 'pdf' | 'docx' | 'html' | 'markdown';

export type ExportOptions = {
  format: ExportFormat;
  includeCanvas: boolean;
  includeCitations: boolean;
  template?: string;
  metadata?: any;
};

export type ExportHistory = {
  id: string;
  reportId: string;
  format: ExportFormat;
  options: ExportOptions;
  fileUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  error?: string;
};

// --- Enhanced Evidence Analysis Types ---
export type EvidenceAnalysis = {
  id: string;
  imageId: string;
  faces: Array<{
    id: string;
    boundingBox: { x: number; y: number; width: number; height: number };
    confidence: number;
    features: any;
    embedding?: number[];
  }>;
  objects: Array<{
    id: string;
    type: string;
    boundingBox: { x: number; y: number; width: number; height: number };
    confidence: number;
    tags: string[];
  }>;
  tags: string[];
  aiSummary?: string;
  legalBertAnalysis?: {
    relevantStatutes: string[];
    evidenceType: string;
    significance: number;
  };
  metadata: {
    processingTime: number;
    modelVersion: string;
    confidence: number;
  };
  createdAt: string;
};
