// Database types for the Legal Case Management System
// Enhanced with proper typing for Gemma3 LLM integration and modern SvelteKit patterns

import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Import schema references (these will be defined in your schema files)
// import { users, cases, criminals, evidence, statutes, crimes } from '$lib/server/db/schema';

// Base utility types
export type UserRole = 'prosecutor' | 'detective' | 'admin' | 'analyst' | 'viewer';
export type CaseStatus = 'open' | 'closed' | 'pending' | 'archived' | 'under_review';
export type EvidenceType = 'document' | 'image' | 'video' | 'audio' | 'physical' | 'digital' | 'testimony';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

// AI/LLM related types for Gemma3 integration
export interface AIResponse {
  answer: string;
  confidence: number;
  sources: Array<{
    id: string;
    title: string;
    content: string;
    similarity: number;
    entityType: string;
    citations?: Array<{
      source: string;
      confidence: number;
      relevance: string;
    }>;
    explanation?: string;
  }>;
  metadata: {
    query: string;
    executionTime: number;
    fromCache: boolean;
    provider: 'local' | 'cloud' | 'hybrid';
    model: string;
    searchStrategy: string;
    tokenUsage?: {
      prompt: number;
      completion: number;
      total: number;
    };
    performance: {
      vectorSearchTime: number;
      llmInferenceTime: number;
      totalTime: number;
    };
  };
  reasoning?: string;
  followUpQuestions?: string[];
  legalContext?: {
    jurisdiction: string;
    docTypes: string[];
    relevantStatutes: string[];
  };
}

// Session and Authentication types
export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: UserRole | null;
  username?: string;
  profile?: { bio?: string } | Record<string, any>;
}

export interface AppSession {
  user: SessionUser | null;
  expires: string | null;
}

// User types
export interface User {
  id: string;
  email: string;
  emailVerified?: Date | null;
  hashedPassword?: string;
  role: UserRole;
  isActive: boolean;
  username?: string;
  image?: string | null;
  profile?: { bio?: string } | Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewUser extends Omit<User, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role: UserRole;
  isActive: boolean;
  emailVerified?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Criminal types
export interface Criminal {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  aliases: string[];
  dateOfBirth?: Date | null;
  placeOfBirth?: string;
  address?: string | null;
  phone?: string;
  email?: string | null;
  socialSecurityNumber?: string;
  driversLicense?: string;
  height?: number;
  weight?: number;
  eyeColor?: string;
  hairColor?: string;
  distinguishingMarks?: string;
  photoUrl?: string;
  fingerprints: any;
  threatLevel: string;
  status: string;
  notes?: string;
  aiSummary?: string;
  aiTags: string[];
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewCriminal extends Omit<Criminal, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Case types with enhanced AI/semantic features
export interface Case {
  id: string;
  caseNumber: string;
  title: string;
  description?: string;
  incidentDate?: Date;
  location?: string;
  priority: Priority;
  status: CaseStatus;
  category?: string;
  dangerScore: number;
  estimatedValue?: number;
  jurisdiction?: string;
  leadProsecutor?: string;
  assignedTeam: string[];
  aiSummary?: string | null;
  aiTags?: string[];
  embedding?: number[];
  evidenceCount?: number;
  formattedDate?: string;
  timeAgo?: string;
  nlpInsights?: any;
  relatedCases?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NewCase extends Omit<Case, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Evidence types
export interface Evidence {
  id: string;
  caseId: string;
  type: EvidenceType;
  description?: string;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  hash?: string;
  metadata: any;
  tags: string[];
  uploadedBy?: string;
  isVerified: boolean;
  verificationDetails?: any;
  aiAnalysis?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewEvidence extends Omit<Evidence, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Statute types
export interface Statute {
  id: string;
  code: string;
  title: string;
  description?: string;
  category?: string;
  penalty?: string;
  jurisdiction?: string;
  effectiveDate?: Date;
  expirationDate?: Date;
  isActive: boolean;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewStatute extends Omit<Statute, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Crime type
export interface Crime {
  id: string;
  name: string;
  description?: string;
  category?: string;
  severity?: string;
  statuteId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Book type for Case Books feature
export interface Book {
  id: string;
  title: string;
  author?: string;
  description?: string;
  publishedAt?: string | Date;
}

// Enhanced types with relations
export interface CaseWithRelations extends Case {
  criminal?: Criminal;
  evidence?: Evidence[];
  assignedTo?: User;
  leadProsecutorUser?: User;
  books?: Book[];
}

export interface UserWithProfile extends User {
  profile?: UserProfile;
}

export interface EvidenceWithMetadata extends Evidence {
  uploadedByUser?: User;
  case?: Case;
}

// Gemma3 specific types
export interface Gemma3Config {
  modelPath: string;
  quantization: 'f16' | 'q4_0' | 'q4_1' | 'q5_0' | 'q5_1' | 'q8_0' | 'Q4_K_M';
  contextLength: number;
  temperature: number;
  topP: number;
  topK: number;
  repeatPenalty: number;
  maxTokens: number;
}

export interface LocalModel {
  id: string;
  name: string;
  type: 'embedding' | 'chat' | 'classification';
  domain: 'general' | 'legal' | 'medical' | 'technical';
  architecture: 'bert' | 'llama' | 'mistral' | 'legal-bert' | 'gemma' | 'gemma3';
  dimensions?: number;
  maxTokens?: number;
  isLoaded: boolean;
  memoryUsage?: number;
  modelPath?: string;
  quantization?: string;
}

// Store types for Svelte state management
export interface AppState {
  user: SessionUser | null;
  cases: Case[];
  selectedCase: Case | null;
  evidence: Evidence[];
  isLoading: boolean;
  error: string | null;
}

// API request/response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LLMRequest {
  query: string;
  sessionId?: string;
  context?: Array<{ role: string; content: string }>;
  options?: {
    provider?: 'local' | 'cloud' | 'auto';
    temperature?: number;
    maxTokens?: number;
    model?: string;
  };
}

// File upload types for IndexedDB and Tauri
export interface FileUpload {
  id: string;
  file: File;
  caseId?: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  metadata?: any;
  createdAt: Date;
}

// IndexedDB storage types
export interface StoredFile {
  id: string;
  fileName: string;
  fileData: ArrayBuffer;
  mimeType: string;
  size: number;
  caseId?: string;
  metadata?: any;
  createdAt: Date;
}

// Event types for Tauri
export interface TauriEvent<T = any> {
  event: string;
  payload: T;
  id: number;
}

export interface EvidenceEvent {
  type: 'created' | 'updated' | 'deleted';
  evidenceId: string;
  caseId: string;
  metadata?: any;
}

// Component prop types
export interface CardProps {
  title?: string;
  description?: string;
  class?: string;
  variant?: 'default' | 'outline' | 'ghost';
}

export interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
  class?: string;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm extends LoginForm {
  confirmPassword: string;
  username: string;
  role: UserRole;
}

export interface CaseForm {
  title: string;
  description?: string;
  priority: Priority;
  category?: string;
  incidentDate?: Date;
  location?: string;
  jurisdiction?: string;
}