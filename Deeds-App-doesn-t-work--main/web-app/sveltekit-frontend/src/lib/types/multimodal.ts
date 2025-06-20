// TypeScript types for multimodal evidence system

export interface EvidenceFile {
  id: string;
  caseId: string;
  fileName: string;
  filePath: string;
  fileType: 'image' | 'video' | 'audio' | 'document';
  fileSize: number;
  mimeType?: string;
  duration?: number; // in seconds for video/audio
  dimensions?: string; // "width,height" format
  checksum?: string;
  uploadedBy?: string;
  processedAt?: Date;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  aiSummary?: string;
  aiAnalysis?: Record<string, any>;
  embedding?: number[];
  tags?: string[];
  metadata?: Record<string, any>;
  enhancedVersions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EvidenceAnchorPoint {
  id: string;
  evidenceFileId: string;
  anchorType: 'object' | 'text' | 'audio_segment' | 'timeline_event' | 'custom';
  positionX: number; // Normalized 0-1 coordinates
  positionY: number;
  timestamp?: number; // For video/audio anchors - time in seconds
  duration?: number; // For time-based anchors - duration in seconds
  label: string;
  description?: string;
  confidence: number;
  detectedObject?: string; // YOLO/CV detection class
  detectedText?: string; // OCR extracted text
  boundingBox?: string; // "x1,y1,x2,y2" format
  legalRelevance?: 'high' | 'medium' | 'low' | 'unknown';
  userNotes?: string;
  aiAnalysis?: Record<string, any>;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CaseEvidenceSummary {
  id: string;
  caseId: string;
  evidenceFileId?: string;
  summaryType: 'scene_analysis' | 'timeline_reconstruction' | 'contradiction_analysis';
  title: string;
  markdownContent: string;
  plainTextContent: string;
  keyFindings?: string[];
  legalImplications?: string[];
  contradictions?: string[];
  timelineEvents?: TimelineEvent[];
  emotionalAnalysis?: Record<string, any>;
  embedding?: number[];
  confidence: number;
  reviewStatus: 'pending' | 'reviewed' | 'approved' | 'disputed';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  generatedBy: 'ai' | 'user' | 'hybrid';
  modelVersion?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimelineEvent {
  timestamp: number;
  type: string;
  description: string;
  confidence: number;
  evidenceIds: string[];
  anchorPointIds: string[];
}

export interface EvidenceRelationship {
  id: string;
  parentEvidenceId: string;
  relatedEvidenceId: string;
  relationshipType: 'sequence' | 'contradiction' | 'corroboration' | 'same_scene' | 'same_person';
  confidence: number;
  description?: string;
  aiAnalysis?: Record<string, any>;
  timelinePosition?: number;
  legalSignificance: 'critical' | 'important' | 'supportive' | 'irrelevant';
  discoveredBy: 'ai' | 'user' | 'auto';
  verifiedBy?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MultimodalSearchResult {
  id: string;
  score: number;
  type: 'evidence' | 'analysis' | 'anchor_point';
  evidenceFile?: EvidenceFile;
  anchorPoint?: EvidenceAnchorPoint;
  summary?: CaseEvidenceSummary;
  snippet?: string;
  relevanceReason?: string;
}

export interface EvidenceProcessingRequest {
  file_path: string;
  case_id: string;
  evidence_type: 'image' | 'video' | 'audio' | 'document';
  enhancement_level?: number; // 1-3 for AI upscaling
  analysis_options?: string[];
  frame_sample_rate?: number; // For video processing
}

export interface EvidenceProcessingResult {
  success: boolean;
  evidence_id: string;
  evidence_file: EvidenceFile;
  anchor_points: EvidenceAnchorPoint[];
  scene_summary_id?: string;
  processing_results: {
    rust: RustProcessingResult;
    python: PythonAnalysisResult;
  };
  analysis_summary: {
    total_anchors: number;
    evidence_type: string;
    processing_time: number;
    ai_confidence: number;
  };
}

export interface RustProcessingResult {
  success: boolean;
  processed_files: string[];
  frame_extracts: string[];
  metadata: {
    file_type: string;
    duration?: number;
    dimensions?: [number, number];
    file_size: number;
    codec?: string;
    bitrate?: number;
    processing_time?: number;
  };
  error_message?: string;
}

export interface PythonAnalysisResult {
  evidence_id: string;
  case_id: string;
  file_path: string;
  evidence_type: string;
  analysis_results: {
    objects?: DetectedObject[];
    text?: TextAnalysis;
    audio?: AudioAnalysis;
    timeline?: TimelineEvent[];
    video_metadata?: VideoMetadata;
    error?: string;
  };
  anchor_points: AnchorPointData[];
  markdown_summary: string;
  text_content: string;
  embeddings?: number[];
}

export interface DetectedObject {
  class: string;
  confidence: number;
  bbox: [number, number, number, number]; // x1, y1, x2, y2
  timestamp?: number; // for video objects
}

export interface TextAnalysis {
  extracted_text: string;
  confidence: 'high' | 'medium' | 'low';
  language?: string;
  entities?: Entity[];
}

export interface AudioAnalysis {
  transcription: string;
  language: string;
  segments: AudioSegment[];
  speaker_count?: number;
  emotional_tone?: string;
}

export interface AudioSegment {
  start: number;
  end: number;
  text: string;
  confidence: number;
  speaker_id?: number;
}

export interface VideoMetadata {
  duration: number;
  fps: number;
  frame_count: number;
  resolution: string;
  frames_analyzed: number;
}

export interface AnchorPointData {
  x: number;
  y: number;
  type: string;
  label: string;
  confidence: number;
  timestamp?: number;
  duration?: number;
  description: string;
  bbox?: [number, number, number, number];
}

export interface Entity {
  text: string;
  type: string;
  start: number;
  end: number;
  confidence: number;
}

export interface SceneAnalysisRequest {
  case_id: string;
  evidence_id: string;
  prompt?: string;
  include_emotions?: boolean;
  include_timeline?: boolean;
}

export interface LegalRAGRequest {
  case_id: string;
  query: string;
  scene_context?: Record<string, any>;
  max_similar_scenes?: number;
}

export interface LegalRAGResponse {
  query: string;
  case_id: string;
  similar_items: {
    type: 'evidence' | 'analysis';
    score: number;
    content: string;
    evidence_type?: string;
    file_path?: string;
    evidence_id?: string;
  }[];
  llm_response?: string;
  total_found: number;
  timestamp: string;
}

export interface UserModelPreference {
  id: string;
  userId: string;
  modelType: 'text_generation' | 'embeddings' | 'vision' | 'audio';
  modelPath: string;
  modelName: string;
  modelVersion?: string;
  isActive: boolean;
  modelConfig: Record<string, any>;
  performanceMetrics: Record<string, any>;
  usageCount: number;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MultimodalSearchCache {
  id: string;
  queryHash: string;
  queryText: string;
  queryType: 'semantic' | 'visual' | 'audio' | 'timeline' | 'cross_modal';
  caseId?: string;
  results: MultimodalSearchResult[];
  resultCount: number;
  searchFilters: Record<string, any>;
  embedding?: number[];
  executionTime?: number;
  accuracy?: number;
  userId?: string;
  createdAt: Date;
  expiresAt: Date;
}
