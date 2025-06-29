// Enhanced Vector Search Service
// Implements production-ready vector search with IVFFlat and HNSW indexes
// Supports hybrid search, caching, and intelligent fallback strategies

import { QdrantClient } from '@qdrant/js-client-rest';
import { db } from '../../db/index';
import { embeddings, vectorSearchCache } from '../../db/schema-pgvector';
import { generateEmbedding, type EmbeddingProvider } from '../../ai/embeddings-enhanced';
import { eq, and, gte, sql, desc, lte } from 'drizzle-orm';
import { createHash } from 'crypto';
import { dev } from '$app/environment';
import type { 
  VectorSearchOptions, 
  VectorSearchResult,
  NewVectorSearchCache 
} from '../../db/schema-pgvector.js';

export interface SearchConfig {
  useQdrant: boolean;
  usePostgreSQL: boolean;
  enableCaching: boolean;
  indexStrategy: 'hnsw' | 'ivfflat' | 'auto';
  embeddingProvider: EmbeddingProvider;
  hybridSearchEnabled: boolean;
}

export interface HybridSearchOptions extends VectorSearchOptions {
  textQuery?: string;
  vectorWeight?: number;
  textWeight?: number;
  useSemanticSearch?: boolean;
  useFuzzySearch?: boolean;
  limit?: number;
  threshold?: number;
  caseId?: string;
  entityType?: string;
}

export interface SearchMetrics {
  queryTime: number;
  resultCount: number;
  source: 'postgresql' | 'qdrant' | 'cache';
  indexUsed: string;
  confidence: number;
}

export interface AdvancedSearchResult extends VectorSearchResult {
  rank: number;
  searchMetrics: SearchMetrics;
  explanation?: string;
  citations?: Array<{
    source: string;
    confidence: number;
    relevance: string;
  }>;
}

class EnhancedVectorSearchService {
  private qdrant: QdrantClient | null = null;
  private config: SearchConfig;
  private cache = new Map<string, { result: any; expires: number }>();

  constructor(config: Partial<SearchConfig> = {}) {
    this.config = {
      useQdrant: !dev,
      usePostgreSQL: true,
      enableCaching: true,
      indexStrategy: 'auto',
      embeddingProvider: 'openai',
      hybridSearchEnabled: true,
      ...config
    };

    this.initializeQdrant();
  }

  // Initialize Qdrant client
  private async initializeQdrant(): Promise<void> {
    if (!this.config.useQdrant) return;

    try {
      const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
      this.qdrant = new QdrantClient({ url: qdrantUrl });
      
      // Verify connection
      await this.qdrant.getCollections();
      console.log('Qdrant client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Qdrant:', error);
      this.qdrant = null;
      this.config.useQdrant = false;
    }
  }

  // Main search method with intelligent routing
  async search(
    query: string,
    options: HybridSearchOptions = {}
  ): Promise<AdvancedSearchResult[]> {
    const startTime = Date.now();
    
    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(query, options);
      
      // Check cache first
      if (this.config.enableCaching) {
        const cachedResult = await this.getCachedResult(cacheKey);
        if (cachedResult) {
          return this.enhanceResults(cachedResult, {
            queryTime: Date.now() - startTime,
            resultCount: cachedResult.length,
            source: 'cache',
            indexUsed: 'cache',
            confidence: 0.95
          });
        }
      }

      // Generate query embedding
      const queryVector = await generateEmbedding(query, this.config.embeddingProvider);
      
      let results: VectorSearchResult[] = [];
      let searchMetrics: SearchMetrics;

      // Hybrid search if enabled and text query provided
      if (this.config.hybridSearchEnabled && options.textQuery) {
        results = await this.performHybridSearch(queryVector, query, options);
        searchMetrics = {
          queryTime: Date.now() - startTime,
          resultCount: results.length,
          source: this.config.useQdrant ? 'qdrant' : 'postgresql',
          indexUsed: 'hybrid',
          confidence: 0.85
        };
      } else {
        // Vector-only search with intelligent routing
        const searchResult = await this.routeVectorSearch(queryVector, options);
        results = searchResult.results;
        searchMetrics = searchResult.metrics;
      }

      // Cache results
      if (this.config.enableCaching && results.length > 0) {
        await this.cacheResults(cacheKey, results, options);
      }

      return this.enhanceResults(results, searchMetrics);
    } catch (error) {
      console.error('Vector search failed:', error);
      throw error;
    }
  }

  // Intelligent search routing based on query characteristics and system load
  private async routeVectorSearch(
    queryVector: number[],
    options: VectorSearchOptions
  ): Promise<{ results: VectorSearchResult[]; metrics: SearchMetrics }> {
    const startTime = Date.now();

    // Determine optimal search strategy
    const strategy = await this.selectSearchStrategy(options);

    let results: VectorSearchResult[] = [];
    let source: 'postgresql' | 'qdrant' = 'postgresql';
    let indexUsed = 'hnsw';

    try {
      if (strategy.useQdrant && this.qdrant) {
        results = await this.searchQdrant(queryVector, options);
        source = 'qdrant';
        indexUsed = 'qdrant-hnsw';
      } else {
        const pgResult = await this.searchPostgreSQL(queryVector, options);
        results = pgResult.results;
        indexUsed = pgResult.indexUsed;
      }
    } catch (error) {
      console.error(`${source} search failed, falling back:`, error);
      
      // Fallback logic
      if (source === 'qdrant') {
        const pgResult = await this.searchPostgreSQL(queryVector, options);
        results = pgResult.results;
        source = 'postgresql';
        indexUsed = pgResult.indexUsed;
      } else {
        throw error;
      }
    }

    return {
      results,
      metrics: {
        queryTime: Date.now() - startTime,
        resultCount: results.length,
        source,
        indexUsed,
        confidence: 0.9
      }
    };
  }

  // Select optimal search strategy based on query characteristics
  private async selectSearchStrategy(options: VectorSearchOptions): Promise<{
    useQdrant: boolean;
    indexStrategy: 'hnsw' | 'ivfflat';
    batchQuery: boolean;
  }> {
    // Use Qdrant for:
    // 1. Complex filtered queries
    // 2. Large result sets
    // 3. Production workloads
    const hasComplexFilters = !!(
      options.entityType || 
      options.caseId || 
      options.contentType
    );
    
    const isLargeQuery = (options.limit || 10) > 50;
    const useQdrant = this.config.useQdrant && (hasComplexFilters || isLargeQuery);

    // Use HNSW for low-latency queries, IVFFlat for batch operations
    const indexStrategy = this.config.indexStrategy === 'auto' 
      ? (isLargeQuery ? 'ivfflat' : 'hnsw')
      : this.config.indexStrategy;

    return {
      useQdrant,
      indexStrategy,
      batchQuery: isLargeQuery
    };
  }

  // Search using PostgreSQL with pgvector
  private async searchPostgreSQL(
    queryVector: number[],
    options: VectorSearchOptions
  ): Promise<{ results: VectorSearchResult[]; indexUsed: string }> {
    const threshold = options.threshold || 0.7;
    const limit = options.limit || 10;
    
    try {
      // Use the optimized search function with proper vector format
      const vectorString = `[${queryVector.join(',')}]`;
      
      const searchQuery = sql`
        SELECT 
          e.id,
          e.entity_type,
          e.entity_id,
          e.content_type,
          e.text_content,
          1 - (e.embedding_vector <=> ${vectorString}::vector) as similarity,
          e.confidence,
          e.metadata,
          e.case_id,
          e.created_at
        FROM embeddings e
        WHERE 
          e.searchable = true
          ${options.language ? sql`AND e.language = ${options.language}` : sql``}
          ${options.entityType ? sql`AND e.entity_type = ${options.entityType}` : sql``}
          ${options.caseId ? sql`AND e.case_id = ${options.caseId}` : sql``}
          ${options.contentType ? sql`AND e.content_type = ${options.contentType}` : sql``}
          AND (1 - (e.embedding_vector <=> ${vectorString}::vector)) >= ${threshold}
        ORDER BY e.embedding_vector <=> ${vectorString}::vector
        LIMIT ${limit}
      `;

      const rawResults = await db.execute(searchQuery);
      
      const results: VectorSearchResult[] = rawResults.map((row: any) => ({
        id: row.id,
        entityType: row.entity_type,
        entityId: row.entity_id,
        contentType: row.content_type,
        textContent: row.text_content,
        similarity: Number(row.similarity),
        confidence: row.confidence ? Number(row.confidence) : undefined,
        metadata: row.metadata,
        caseId: row.case_id,
        createdAt: new Date(row.created_at)
      }));

      // Determine which index was likely used based on query characteristics
      const indexUsed = this.config.indexStrategy === 'ivfflat' || limit > 50 
        ? 'ivfflat' 
        : 'hnsw';

      return { results, indexUsed };
    } catch (error) {
      console.error('PostgreSQL vector search failed:', error);
      throw error;
    }
  }

  // Search using Qdrant
  private async searchQdrant(
    queryVector: number[],
    options: VectorSearchOptions
  ): Promise<VectorSearchResult[]> {
    if (!this.qdrant) {
      throw new Error('Qdrant client not available');
    }

    const searchParams: any = {
      vector: queryVector,
      limit: options.limit || 10,
      score_threshold: options.threshold || 0.7,
      with_payload: true
    };

    // Add filters
    const filter: any = { must: [] };
    
    if (options.entityType) {
      filter.must.push({ key: 'entity_type', match: { value: options.entityType } });
    }
    
    if (options.caseId) {
      filter.must.push({ key: 'case_id', match: { value: options.caseId } });
    }
    
    if (options.contentType) {
      filter.must.push({ key: 'content_type', match: { value: options.contentType } });
    }

    if (filter.must.length > 0) {
      searchParams.filter = filter;
    }

    try {
      const searchResult = await this.qdrant.search('embeddings', searchParams);
      
      return searchResult.map(hit => ({
        id: hit.id as string,
        entityType: hit.payload?.entity_type as string,
        entityId: hit.payload?.entity_id as string,
        contentType: hit.payload?.content_type as string,
        textContent: hit.payload?.text_content as string,
        similarity: hit.score,
        confidence: hit.payload?.confidence as number | undefined,
        metadata: hit.payload?.metadata as Record<string, any> | undefined,
        caseId: hit.payload?.case_id as string | undefined,
        createdAt: new Date(hit.payload?.created_at as string)
      }));
    } catch (error) {
      console.error('Qdrant search failed:', error);
      throw error;
    }
  }

  // Perform hybrid search combining vector and text search
  private async performHybridSearch(
    queryVector: number[],
    textQuery: string,
    options: HybridSearchOptions
  ): Promise<VectorSearchResult[]> {
    const vectorWeight = options.vectorWeight || 0.7;
    const textWeight = options.textWeight || 0.3;
    const limit = options.limit || 10;
    const threshold = options.threshold || 0.6;

    // Use PostgreSQL's hybrid search function
    const vectorString = `[${queryVector.join(',')}]`;
    
    const hybridQuery = sql`
      SELECT 
        e.id,
        e.entity_type,
        e.entity_id,
        e.content_type,
        e.text_content,
        (${vectorWeight} * (1 - (e.embedding_vector <=> ${vectorString}::vector))) + 
        (${textWeight} * ts_rank_cd(to_tsvector('english', e.text_content), plainto_tsquery('english', ${textQuery}))) as combined_score,
        1 - (e.embedding_vector <=> ${vectorString}::vector) as vector_similarity,
        ts_rank_cd(to_tsvector('english', e.text_content), plainto_tsquery('english', ${textQuery})) as text_similarity,
        e.confidence,
        e.metadata,
        e.case_id,
        e.created_at
      FROM embeddings e
      WHERE 
        e.searchable = true
        ${options.caseId ? sql`AND e.case_id = ${options.caseId}` : sql``}
        AND (
          (1 - (e.embedding_vector <=> ${vectorString}::vector)) >= ${threshold}
          OR to_tsvector('english', e.text_content) @@ plainto_tsquery('english', ${textQuery})
        )
      ORDER BY combined_score DESC
      LIMIT ${limit}
    `;

    const rawResults = await db.execute(hybridQuery);
    
    return rawResults.map((row: any) => ({
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      contentType: row.content_type,
      textContent: row.text_content,
      similarity: Number(row.combined_score),
      confidence: row.confidence ? Number(row.confidence) : undefined,
      metadata: {
        ...row.metadata,
        vector_similarity: Number(row.vector_similarity),
        text_similarity: Number(row.text_similarity),
        combined_score: Number(row.combined_score)
      },
      caseId: row.case_id,
      createdAt: new Date(row.created_at)
    }));
  }

  // Enhanced result processing with citations and explanations
  private enhanceResults(
    results: VectorSearchResult[],
    metrics: SearchMetrics
  ): AdvancedSearchResult[] {
    return results.map((result, index) => ({
      ...result,
      rank: index + 1,
      searchMetrics: metrics,
      explanation: this.generateExplanation(result, metrics),
      citations: this.generateCitations(result)
    }));
  }

  // Generate explanation for why this result was returned
  private generateExplanation(result: VectorSearchResult, metrics: SearchMetrics): string {
    const similarityPercentage = Math.round(result.similarity * 100);
    const source = metrics.source === 'cache' ? 'cached' : metrics.source;
    
    return `Found via ${source} search with ${similarityPercentage}% similarity using ${metrics.indexUsed} index. ` +
           `Content type: ${result.contentType}, Entity: ${result.entityType}.`;
  }

  // Generate citations for the result
  private generateCitations(result: VectorSearchResult): Array<{
    source: string;
    confidence: number;
    relevance: string;
  }> {
    const confidence = result.confidence || result.similarity;
    
    return [{
      source: `${result.entityType}:${result.entityId}`,
      confidence,
      relevance: confidence > 0.8 ? 'high' : confidence > 0.6 ? 'medium' : 'low'
    }];
  }

  // Cache management
  private generateCacheKey(query: string, options: VectorSearchOptions): string {
    const keyData = {
      query: query.trim().toLowerCase(),
      ...options
    };
    return createHash('sha256').update(JSON.stringify(keyData)).digest('hex');
  }

  private async getCachedResult(cacheKey: string): Promise<VectorSearchResult[] | null> {
    try {
      const cached = await db.select()
        .from(vectorSearchCache)
        .where(and(
          eq(vectorSearchCache.queryHash, cacheKey),
          gte(vectorSearchCache.expiresAt, new Date())
        ))
        .limit(1);

      if (cached.length > 0) {
        // Update hit count and last accessed
        await db.update(vectorSearchCache)
          .set({
            hitCount: cached[0].hitCount + 1,
            lastAccessed: new Date()
          })
          .where(eq(vectorSearchCache.id, cached[0].id));

        return cached[0].results as VectorSearchResult[];
      }
    } catch (error) {
      console.error('Cache retrieval failed:', error);
    }
    
    return null;
  }

  private async cacheResults(
    cacheKey: string,
    results: VectorSearchResult[],
    options: VectorSearchOptions,
    ttlMinutes = 60
  ): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
      
      const cacheEntry: NewVectorSearchCache = {
        queryHash: cacheKey,
        queryText: '', // Would need to store original query
        queryVector: [], // Would store the query vector
        searchFilters: options as any,
        limitValue: options.limit || 10,
        threshold: options.threshold?.toString() || '0.7',
        results: results as any,
        resultCount: results.length,
        processingTime: 0, // Would track actual processing time
        expiresAt,
        caseId: options.caseId
      };

      await db.insert(vectorSearchCache).values(cacheEntry);
    } catch (error) {
      console.error('Cache storage failed:', error);
    }
  }

  // Public utility methods
  public async findSimilarEntities(
    entityId: string,
    entityType: string,
    options: Partial<VectorSearchOptions> = {}
  ): Promise<AdvancedSearchResult[]> {
    // Get the entity's embedding
    const entity = await db.select()
      .from(embeddings)
      .where(and(
        eq(embeddings.entityId, entityId),
        eq(embeddings.entityType, entityType)
      ))
      .limit(1);

    if (entity.length === 0) {
      throw new Error('Entity not found');
    }

    const queryVector = entity[0].embeddingVector as number[];
    
    return this.routeVectorSearch(queryVector, {
      entityType,
      limit: 10,
      threshold: 0.8,
      ...options
    }).then(result => this.enhanceResults(result.results, result.metrics));
  }

  public async searchByEntityType(
    query: string,
    entityType: string,
    options: Partial<HybridSearchOptions> = {}
  ): Promise<AdvancedSearchResult[]> {
    return this.search(query, {
      entityType,
      ...options
    });
  }

  public async searchByCase(
    query: string,
    caseId: string,
    options: Partial<HybridSearchOptions> = {}
  ): Promise<AdvancedSearchResult[]> {
    return this.search(query, {
      caseId,
      ...options
    });
  }

  // Batch search for multiple queries
  public async batchSearch(
    queries: Array<{ query: string; options?: HybridSearchOptions }>,
    concurrency = 3
  ): Promise<Array<{ query: string; results: AdvancedSearchResult[] }>> {
    const results: Array<{ query: string; results: AdvancedSearchResult[] }> = [];
    
    // Process in batches to avoid overwhelming the system
    for (let i = 0; i < queries.length; i += concurrency) {
      const batch = queries.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async ({ query, options }) => ({
        query,
        results: await this.search(query, options)
      }));

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  // Analytics and monitoring
  public async getSearchMetrics(): Promise<{
    totalQueries: number;
    avgResponseTime: number;
    cacheHitRate: number;
    indexUsage: Record<string, number>;
  }> {
    try {
      const metrics = await db.select({
        totalQueries: sql<number>`count(*)`,
        avgResponseTime: sql<number>`avg(processing_time)`,
        cacheHits: sql<number>`sum(hit_count)`,
      }).from(vectorSearchCache);

      return {
        totalQueries: metrics[0]?.totalQueries || 0,
        avgResponseTime: metrics[0]?.avgResponseTime || 0,
        cacheHitRate: metrics[0]?.cacheHits || 0,
        indexUsage: {} // Would track index usage statistics
      };
    } catch (error) {
      console.error('Failed to get search metrics:', error);
      return {
        totalQueries: 0,
        avgResponseTime: 0,
        cacheHitRate: 0,
        indexUsage: {}
      };
    }
  }
}

// Singleton instance
export const vectorSearch = new EnhancedVectorSearchService();

export default vectorSearch;
