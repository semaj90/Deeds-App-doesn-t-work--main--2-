// Enhanced PostgreSQL + pgvector Schema for RAG System
// This extends the unified schema with proper vector embeddings support

import { 
  pgTable, 
  text, 
  varchar, 
  integer, 
  timestamp, 
  jsonb, 
  boolean,
  decimal,
  uuid,
  index,
  customType
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Import base schema
export * from './unified-schema';
import { users, cases, evidence, criminals } from './unified-schema';

// Define pgvector custom type
const vector = customType<{ 
  data: number[]; 
  driverData: string; 
  config: { dimensions?: number }; 
}>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 1536})`;
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    return value.slice(1, -1).split(',').map(Number);
  },
});

// === VECTOR EMBEDDINGS TABLE (PostgreSQL + pgvector) ===
export const embeddings = pgTable('embeddings', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Source references
  entityType: varchar('entity_type', { length: 50 }).notNull(), // 'case', 'evidence', 'document', 'criminal', 'statute'
  entityId: uuid('entity_id').notNull(),
  contentType: varchar('content_type', { length: 50 }).notNull(), // 'title', 'description', 'full_text', 'summary'
  
  // Content and vector data
  textContent: text('text_content').notNull(),
  embeddingVector: vector('embedding_vector', { dimensions: 1536 }), // pgvector column for OpenAI embeddings (1536 dimensions)
  embeddingModel: varchar('embedding_model', { length: 100 }).notNull().default('text-embedding-ada-002'),
  
  // Metadata and context
  chunkIndex: integer('chunk_index').default(0).notNull(), // For large documents split into chunks
  chunkSize: integer('chunk_size'), // Size of the text chunk
  metadata: jsonb('metadata').default({}).notNull(), // Flexible metadata storage
  
  // Quality and processing info
  confidence: decimal('confidence', { precision: 5, scale: 4 }), // Embedding quality score
  processingTime: integer('processing_time'), // milliseconds
  language: varchar('language', { length: 10 }).default('en').notNull(),
  
  // Index for search optimization
  searchable: boolean('searchable').default(true).notNull(),
  
  // Relationships and context
  caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').references(() => users.id),
  
  // Timestamps
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// === VECTOR SEARCH CACHE ===
export const vectorSearchCache = pgTable('vector_search_cache', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Query details
  queryText: text('query_text').notNull(),
  queryHash: varchar('query_hash', { length: 64 }).notNull().unique(), // SHA-256 hash of normalized query
  queryVector: vector('query_vector', { dimensions: 1536 }), // The query embedding vector
  
  // Search parameters
  searchFilters: jsonb('search_filters').default({}).notNull(), // entityType, caseId, etc.
  limitValue: integer('limit_value').default(10).notNull(),
  threshold: decimal('threshold', { precision: 5, scale: 4 }).default('0.7000').notNull(),
  
  // Results (for caching)
  results: jsonb('results').notNull(), // Array of search results
  resultCount: integer('result_count').notNull(),
  processingTime: integer('processing_time').notNull(), // milliseconds
  
  // Cache management
  hitCount: integer('hit_count').default(1).notNull(),
  lastAccessed: timestamp('last_accessed', { mode: 'date' }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(), // TTL for cache entries
  
  // Context
  caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').references(() => users.id),
  
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// === AI ANALYSIS RESULTS ===
export const aiAnalyses = pgTable('ai_analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Source references
  sourceType: varchar('source_type', { length: 50 }).notNull(), // 'case', 'evidence', 'document', 'text'
  sourceId: uuid('source_id').notNull(),
  caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade' }),
  
  // Analysis details
  analysisType: varchar('analysis_type', { length: 100 }).notNull(), // 'sentiment', 'entity', 'summary', 'classification'
  model: varchar('model', { length: 100 }),
  version: varchar('version', { length: 20 }),
  
  // Input and results
  inputText: text('input_text').notNull(),
  result: jsonb('result').notNull(),
  confidence: decimal('confidence', { precision: 5, scale: 4 }),
  processingTime: integer('processing_time'), // milliseconds
  
  // Status tracking
  status: varchar('status', { length: 20 }).default('completed').notNull(), // 'pending', 'processing', 'completed', 'failed'
  error: text('error'),
  
  // Context and metadata
  parameters: jsonb('parameters').default({}).notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  
  // Relationships
  requestedBy: uuid('requested_by').references(() => users.id),
  
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// === RAG SESSIONS (for conversation context) ===
export const ragSessions = pgTable('rag_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Session details
  sessionId: varchar('session_id', { length: 100 }).notNull().unique(),
  title: varchar('title', { length: 255 }),
  
  // Context
  caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Configuration
  model: varchar('model', { length: 100 }).default('gpt-3.5-turbo').notNull(),
  systemPrompt: text('system_prompt'),
  temperature: decimal('temperature', { precision: 3, scale: 2 }).default('0.70'),
  maxTokens: integer('max_tokens').default(1000),
  
  // State management
  isActive: boolean('is_active').default(true).notNull(),
  messageCount: integer('message_count').default(0).notNull(),
  
  // Metadata
  metadata: jsonb('metadata').default({}).notNull(),
  
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  lastMessageAt: timestamp('last_message_at', { mode: 'date' }),
});

// === RAG MESSAGES ===
export const ragMessages = pgTable('rag_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Session context
  sessionId: uuid('session_id').notNull().references(() => ragSessions.id, { onDelete: 'cascade' }),
  messageIndex: integer('message_index').notNull(), // Order within session
  
  // Message details
  role: varchar('role', { length: 20 }).notNull(), // 'user', 'assistant', 'system'
  content: text('content').notNull(),
  
  // RAG context (for assistant messages)
  retrievedSources: jsonb('retrieved_sources').default([]).notNull(), // Array of source references
  sourceCount: integer('source_count').default(0).notNull(),
  retrievalScore: decimal('retrieval_score', { precision: 5, scale: 4 }),
  
  // Token usage and costs
  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),
  totalTokens: integer('total_tokens'),
  cost: decimal('cost', { precision: 8, scale: 6 }),
  
  // Processing info
  processingTime: integer('processing_time'), // milliseconds
  model: varchar('model', { length: 100 }),
  
  // Metadata
  metadata: jsonb('metadata').default({}).notNull(),
  
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// === INDEXES ===
export const embeddingsEntityIdx = index('idx_embeddings_entity').on(embeddings.entityType, embeddings.entityId);
export const embeddingsCaseIdx = index('idx_embeddings_case_id').on(embeddings.caseId);
export const embeddingsSearchableIdx = index('idx_embeddings_searchable').on(embeddings.searchable);
export const embeddingsCreatedAtIdx = index('idx_embeddings_created_at').on(embeddings.createdAt);

export const vectorCacheQueryHashIdx = index('idx_vector_cache_query_hash').on(vectorSearchCache.queryHash);
export const vectorCacheExpiresAtIdx = index('idx_vector_cache_expires_at').on(vectorSearchCache.expiresAt);
export const vectorCacheLastAccessedIdx = index('idx_vector_cache_last_accessed').on(vectorSearchCache.lastAccessed);
export const vectorCacheCaseIdIdx = index('idx_vector_cache_case_id').on(vectorSearchCache.caseId);

export const aiAnalysesSourceIdx = index('idx_ai_analyses_source').on(aiAnalyses.sourceType, aiAnalyses.sourceId);
export const aiAnalysesCaseIdIdx = index('idx_ai_analyses_case_id').on(aiAnalyses.caseId);
export const aiAnalysesTypeIdx = index('idx_ai_analyses_type').on(aiAnalyses.analysisType);
export const aiAnalysesStatusIdx = index('idx_ai_analyses_status').on(aiAnalyses.status);

export const ragSessionsSessionIdIdx = index('idx_rag_sessions_session_id').on(ragSessions.sessionId);
export const ragSessionsCaseIdIdx = index('idx_rag_sessions_case_id').on(ragSessions.caseId);
export const ragSessionsUserIdIdx = index('idx_rag_sessions_user_id').on(ragSessions.userId);

export const ragMessagesSessionIdx = index('idx_rag_messages_session').on(ragMessages.sessionId, ragMessages.messageIndex);
export const ragMessagesRoleIdx = index('idx_rag_messages_role').on(ragMessages.role);

// === RELATIONS ===
export const embeddingsRelations = relations(embeddings, ({ one }) => ({
  case: one(cases, {
    fields: [embeddings.caseId],
    references: [cases.id],
  }),
  createdBy: one(users, {
    fields: [embeddings.createdBy],
    references: [users.id],
  }),
}));

export const vectorSearchCacheRelations = relations(vectorSearchCache, ({ one }) => ({
  case: one(cases, {
    fields: [vectorSearchCache.caseId],
    references: [cases.id],
  }),
  createdBy: one(users, {
    fields: [vectorSearchCache.createdBy],
    references: [users.id],
  }),
}));

export const aiAnalysesRelations = relations(aiAnalyses, ({ one }) => ({
  case: one(cases, {
    fields: [aiAnalyses.caseId],
    references: [cases.id],
  }),
  requestedBy: one(users, {
    fields: [aiAnalyses.requestedBy],
    references: [users.id],
  }),
}));

export const ragSessionsRelations = relations(ragSessions, ({ one, many }) => ({
  case: one(cases, {
    fields: [ragSessions.caseId],
    references: [cases.id],
  }),
  user: one(users, {
    fields: [ragSessions.userId],
    references: [users.id],
  }),
  messages: many(ragMessages),
}));

export const ragMessagesRelations = relations(ragMessages, ({ one }) => ({
  session: one(ragSessions, {
    fields: [ragMessages.sessionId],
    references: [ragSessions.id],
  }),
}));

// === TYPE EXPORTS ===
export type Embedding = typeof embeddings.$inferSelect;
export type NewEmbedding = typeof embeddings.$inferInsert;
export type VectorSearchCache = typeof vectorSearchCache.$inferSelect;
export type NewVectorSearchCache = typeof vectorSearchCache.$inferInsert;
export type AIAnalysis = typeof aiAnalyses.$inferSelect;
export type NewAIAnalysis = typeof aiAnalyses.$inferInsert;
export type RAGSession = typeof ragSessions.$inferSelect;
export type NewRAGSession = typeof ragSessions.$inferInsert;
export type RAGMessage = typeof ragMessages.$inferSelect;
export type NewRAGMessage = typeof ragMessages.$inferInsert;

// === UTILITY FUNCTIONS ===
export const embeddingUtils = {
  // Calculate cosine similarity between two vectors
  cosineSimilarity: (a: number[], b: number[]): number => {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }
    const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  },
  
  // Normalize vector to unit length
  normalize: (vector: number[]): number[] => {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  },
  
  // Generate a cache key for search queries
  generateCacheKey: (query: string, filters: Record<string, any> = {}): string => {
    const normalizedQuery = query.trim().toLowerCase();
    const sortedFilters = Object.keys(filters).sort().reduce((obj, key) => {
      obj[key] = filters[key];
      return obj;
    }, {} as Record<string, any>);
    
    const combined = JSON.stringify({ query: normalizedQuery, filters: sortedFilters });
    // In a real implementation, you'd use a proper hash function like crypto.createHash
    return btoa(combined); // Base64 encode for simplicity
  },

  // Create a hash for a query (for cache keys)
  hashQuery: async (query: string, filters?: Record<string, any>): Promise<string> => {
    const combined = JSON.stringify({ 
      query: query.trim().toLowerCase(), 
      filters: filters || {} 
    });
    
    // Use Web Crypto API (available in Node.js 16+)
    if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(combined);
      const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // Fallback to simple hash
    return btoa(combined);
  },

  // Validate vector dimensions
  validateVector: (vector: number[], expectedDimensions: number = 1536): boolean => {
    return Array.isArray(vector) && vector.length === expectedDimensions && 
           vector.every(v => typeof v === 'number' && !isNaN(v));
  }
};

// === VECTOR SEARCH TYPES ===
export interface VectorSearchOptions {
  entityType?: string;
  entityId?: string;
  caseId?: string;
  contentType?: string;
  language?: string;
  threshold?: number;
  limit?: number;
  includeMetadata?: boolean;
  searchable?: boolean;
}

export interface VectorSearchResult {
  id: string;
  entityType: string;
  entityId: string;
  contentType: string;
  textContent: string;
  similarity: number;
  confidence?: number;
  metadata?: Record<string, any>;
  caseId?: string;
  createdAt: Date;
}

export interface EmbeddingGenerationOptions {
  model?: string;
  chunkSize?: number;
  overlap?: number;
  language?: string;
  metadata?: Record<string, any>;
}
