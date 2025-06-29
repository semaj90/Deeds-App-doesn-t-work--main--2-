// Enhanced Background Sync Service
// Implements event-driven sync between PostgreSQL and Qdrant
// Based on architectural recommendations for high-performance RAG

import { EventEmitter } from 'events';
import { createClient, type RedisClientType } from 'redis';
import { QdrantClient } from '@qdrant/js-client-rest';
import { db } from '$lib/server/db/index.js';
import { embeddings, vectorSearchCache } from '$lib/server/db/schema-pgvector.js';
import { generateEmbedding } from '$lib/server/ai/embeddings-enhanced.js';
import { eq, and, gte, isNull } from 'drizzle-orm';
import { dev } from '$app/environment';

// Sync event types
export type SyncEvent = 
  | 'entity_created'
  | 'entity_updated'
  | 'entity_deleted'
  | 'embedding_generated'
  | 'bulk_sync_requested'
  | 'cache_invalidated';

export interface SyncEventData {
  entityType: string;
  entityId: string;
  caseId?: string;
  operation: SyncEvent;
  timestamp: Date;
  metadata?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface SyncOptions {
  enableEventDriven: boolean;
  enableCronJobs: boolean;
  batchSize: number;
  maxRetries: number;
  retryDelay: number;
  qdrantEnabled: boolean;
  redisEnabled: boolean;
}

export interface SyncMetrics {
  eventsProcessed: number;
  syncLatency: number;
  failureRate: number;
  queueSize: number;
  lastSyncTime: Date;
}

class BackgroundSyncService extends EventEmitter {
  private redis: RedisClientType | null = null;
  private qdrant: QdrantClient | null = null;
  private isRunning = false;
  private syncQueue: SyncEventData[] = [];
  private processingQueue = false;
  private metrics: SyncMetrics;
  private options: SyncOptions;
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(options: Partial<SyncOptions> = {}) {
    super();
    
    this.options = {
      enableEventDriven: true,
      enableCronJobs: true,
      batchSize: 50,
      maxRetries: 3,
      retryDelay: 5000,
      qdrantEnabled: !dev,
      redisEnabled: !dev,
      ...options
    };

    this.metrics = {
      eventsProcessed: 0,
      syncLatency: 0,
      failureRate: 0,
      queueSize: 0,
      lastSyncTime: new Date()
    };

    this.setupEventListeners();
  }

  // Initialize connections and start sync processes
  async initialize(): Promise<void> {
    try {
      // Initialize Redis for event streaming (production only)
      if (this.options.redisEnabled) {
        await this.initializeRedis();
      }

      // Initialize Qdrant client (production only)
      if (this.options.qdrantEnabled) {
        await this.initializeQdrant();
      }

      // Set up database triggers for event-driven sync
      if (this.options.enableEventDriven) {
        await this.setupDatabaseTriggers();
      }

      // Start cron-based sync jobs
      if (this.options.enableCronJobs) {
        this.startCronJobs();
      }

      // Start queue processing
      this.startQueueProcessor();

      this.isRunning = true;
      console.log('Background sync service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize background sync service:', error);
      throw error;
    }
  }

  // Initialize Redis for event streaming
  private async initializeRedis(): Promise<void> {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    try {
      this.redis = createClient({ url: redisUrl });
      
      this.redis.on('error', (err) => {
        console.error('Redis client error:', err);
      });

      await this.redis.connect();
      
      // Subscribe to sync events
      await this.redis.subscribe('embedding_sync', (message) => {
        try {
          const eventData: SyncEventData = JSON.parse(message);
          this.queueSyncEvent(eventData);
        } catch (error) {
          console.error('Failed to parse sync event:', error);
        }
      });

      console.log('Redis connection established for event streaming');
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.redis = null;
    }
  }

  // Initialize Qdrant client
  private async initializeQdrant(): Promise<void> {
    const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
    
    try {
      this.qdrant = new QdrantClient({ url: qdrantUrl });
      
      // Verify connection
      await this.qdrant.getCollections();
      
      // Ensure required collections exist
      await this.ensureQdrantCollections();
      
      console.log('Qdrant connection established');
    } catch (error) {
      console.error('Failed to initialize Qdrant:', error);
      this.qdrant = null;
    }
  }

  // Set up PostgreSQL triggers for event-driven sync
  private async setupDatabaseTriggers(): Promise<void> {
    try {
      const triggerSQL = `
        -- Function to notify about embedding changes
        CREATE OR REPLACE FUNCTION notify_embedding_change()
        RETURNS TRIGGER AS $$
        DECLARE
          event_data jsonb;
        BEGIN
          event_data := jsonb_build_object(
            'entityType', COALESCE(NEW.entity_type, OLD.entity_type),
            'entityId', COALESCE(NEW.entity_id, OLD.entity_id),
            'caseId', COALESCE(NEW.case_id, OLD.case_id),
            'operation', TG_OP,
            'timestamp', NOW(),
            'priority', 'normal'
          );
          
          PERFORM pg_notify('embedding_sync', event_data::text);
          RETURN COALESCE(NEW, OLD);
        END;
        $$ LANGUAGE plpgsql;

        -- Triggers for embeddings table
        DROP TRIGGER IF EXISTS embedding_change_trigger ON embeddings;
        CREATE TRIGGER embedding_change_trigger
          AFTER INSERT OR UPDATE OR DELETE ON embeddings
          FOR EACH ROW EXECUTE FUNCTION notify_embedding_change();

        -- Function for bulk sync notifications
        CREATE OR REPLACE FUNCTION notify_bulk_sync(entity_type text, case_id uuid DEFAULT NULL)
        RETURNS void AS $$
        DECLARE
          event_data jsonb;
        BEGIN
          event_data := jsonb_build_object(
            'entityType', entity_type,
            'caseId', case_id,
            'operation', 'bulk_sync_requested',
            'timestamp', NOW(),
            'priority', 'low'
          );
          
          PERFORM pg_notify('embedding_sync', event_data::text);
        END;
        $$ LANGUAGE plpgsql;
      `;

      await db.execute(triggerSQL);
      console.log('Database triggers set up for event-driven sync');
    } catch (error) {
      console.error('Failed to set up database triggers:', error);
    }
  }

  // Ensure Qdrant collections exist
  private async ensureQdrantCollections(): Promise<void> {
    if (!this.qdrant) return;

    const collections = [
      {
        name: 'embeddings',
        config: {
          vectors: {
            size: 1536,
            distance: 'Cosine'
          }
        }
      },
      {
        name: 'legal_documents',
        config: {
          vectors: {
            size: 768, // Legal-BERT dimensions
            distance: 'Cosine'
          }
        }
      }
    ];

    for (const collection of collections) {
      try {
        await this.qdrant.getCollection(collection.name);
      } catch (error) {
        // Collection doesn't exist, create it
        try {
          await this.qdrant.createCollection(collection.name, collection.config);
          console.log(`Created Qdrant collection: ${collection.name}`);
        } catch (createError) {
          console.error(`Failed to create Qdrant collection ${collection.name}:`, createError);
        }
      }
    }
  }

  // Set up event listeners for internal events
  private setupEventListeners(): Promise<void> {
    // Listen for PostgreSQL NOTIFY events in development
    if (dev) {
      // In development, use periodic polling since we might not have Redis
      setInterval(() => {
        this.pollForChanges();
      }, 30000); // Poll every 30 seconds
    }

    return Promise.resolve();
  }

  // Start cron-based sync jobs
  private startCronJobs(): void {
    // Full sync every hour
    const fullSyncInterval = setInterval(async () => {
      await this.performFullSync();
    }, 60 * 60 * 1000); // 1 hour

    this.syncIntervals.set('fullSync', fullSyncInterval);

    // Cache cleanup every 15 minutes
    const cacheCleanupInterval = setInterval(async () => {
      await this.cleanupExpiredCache();
    }, 15 * 60 * 1000); // 15 minutes

    this.syncIntervals.set('cacheCleanup', cacheCleanupInterval);

    // Metrics collection every 5 minutes
    const metricsInterval = setInterval(() => {
      this.updateMetrics();
    }, 5 * 60 * 1000); // 5 minutes

    this.syncIntervals.set('metrics', metricsInterval);

    console.log('Cron jobs started for periodic sync operations');
  }

  // Start queue processor
  private startQueueProcessor(): void {
    setInterval(async () => {
      if (!this.processingQueue && this.syncQueue.length > 0) {
        await this.processQueue();
      }
    }, 5000); // Process queue every 5 seconds
  }

  // Queue a sync event for processing
  public queueSyncEvent(eventData: SyncEventData): void {
    this.syncQueue.push(eventData);
    this.metrics.queueSize = this.syncQueue.length;
    
    // Process high priority events immediately
    if (eventData.priority === 'urgent' || eventData.priority === 'high') {
      setImmediate(() => this.processQueue());
    }
  }

  // Process the sync queue
  private async processQueue(): Promise<void> {
    if (this.processingQueue) return;
    
    this.processingQueue = true;
    
    try {
      // Sort by priority (urgent > high > normal > low)
      this.syncQueue.sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
        return (priorityOrder[b.priority || 'normal'] || 2) - (priorityOrder[a.priority || 'normal'] || 2);
      });

      // Process in batches
      while (this.syncQueue.length > 0) {
        const batch = this.syncQueue.splice(0, this.options.batchSize);
        await this.processBatch(batch);
        
        this.metrics.queueSize = this.syncQueue.length;
        this.metrics.eventsProcessed += batch.length;
      }
    } catch (error) {
      console.error('Error processing sync queue:', error);
    } finally {
      this.processingQueue = false;
    }
  }

  // Process a batch of sync events
  private async processBatch(events: SyncEventData[]): Promise<void> {
    const startTime = Date.now();
    let failures = 0;

    for (const event of events) {
      try {
        await this.processSyncEvent(event);
      } catch (error) {
        console.error('Failed to process sync event:', error);
        failures++;
        
        // Retry logic for failed events
        if (event.priority !== 'low') {
          await this.retryEvent(event);
        }
      }
    }

    // Update metrics
    const processingTime = Date.now() - startTime;
    this.metrics.syncLatency = processingTime / events.length;
    this.metrics.failureRate = failures / events.length;
    this.metrics.lastSyncTime = new Date();
  }

  // Process individual sync event
  private async processSyncEvent(event: SyncEventData): Promise<void> {
    switch (event.operation) {
      case 'entity_created':
      case 'entity_updated':
        await this.syncEntityToQdrant(event);
        break;
      
      case 'entity_deleted':
        await this.deleteFromQdrant(event);
        break;
      
      case 'embedding_generated':
        await this.updateQdrantEmbedding(event);
        break;
      
      case 'bulk_sync_requested':
        await this.performBulkSync(event);
        break;
      
      case 'cache_invalidated':
        await this.invalidateCache(event);
        break;
      
      default:
        console.warn('Unknown sync operation:', event.operation);
    }
  }

  // Sync entity to Qdrant
  private async syncEntityToQdrant(event: SyncEventData): Promise<void> {
    if (!this.qdrant) return;

    try {
      // Get embedding from PostgreSQL
      const embedding = await db.select()
        .from(embeddings)
        .where(and(
          eq(embeddings.entityType, event.entityType),
          eq(embeddings.entityId, event.entityId)
        ))
        .limit(1);

      if (embedding.length === 0) return;

      const embeddingData = embedding[0];
      
      // Prepare Qdrant payload
      const payload = {
        entity_type: embeddingData.entityType,
        entity_id: embeddingData.entityId,
        content_type: embeddingData.contentType,
        text_content: embeddingData.textContent,
        case_id: embeddingData.caseId,
        metadata: embeddingData.metadata,
        created_at: embeddingData.createdAt?.toISOString()
      };

      // Upsert to Qdrant
      await this.qdrant.upsert('embeddings', {
        wait: true,
        points: [{
          id: embeddingData.id,
          vector: embeddingData.embeddingVector as number[],
          payload
        }]
      });

      console.log(`Synced entity ${event.entityId} to Qdrant`);
    } catch (error) {
      console.error('Failed to sync entity to Qdrant:', error);
      throw error;
    }
  }

  // Delete from Qdrant
  private async deleteFromQdrant(event: SyncEventData): Promise<void> {
    if (!this.qdrant) return;

    try {
      await this.qdrant.delete('embeddings', {
        wait: true,
        points: [event.entityId]
      });

      console.log(`Deleted entity ${event.entityId} from Qdrant`);
    } catch (error) {
      console.error('Failed to delete from Qdrant:', error);
      throw error;
    }
  }

  // Update Qdrant embedding
  private async updateQdrantEmbedding(event: SyncEventData): Promise<void> {
    // Same as syncEntityToQdrant for upsert behavior
    await this.syncEntityToQdrant(event);
  }

  // Perform bulk sync
  private async performBulkSync(event: SyncEventData): Promise<void> {
    try {
      const batchSize = 100;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const embeddingsBatch = await db.select()
          .from(embeddings)
          .where(
            event.caseId 
              ? eq(embeddings.caseId, event.caseId)
              : eq(embeddings.entityType, event.entityType)
          )
          .limit(batchSize)
          .offset(offset);

        if (embeddingsBatch.length === 0) {
          hasMore = false;
          break;
        }

        // Sync batch to Qdrant
        if (this.qdrant && embeddingsBatch.length > 0) {
          const points = embeddingsBatch.map(emb => ({
            id: emb.id,
            vector: emb.embeddingVector as number[],
            payload: {
              entity_type: emb.entityType,
              entity_id: emb.entityId,
              content_type: emb.contentType,
              text_content: emb.textContent,
              case_id: emb.caseId,
              metadata: emb.metadata,
              created_at: emb.createdAt?.toISOString()
            }
          }));

          await this.qdrant.upsert('embeddings', {
            wait: true,
            points
          });
        }

        offset += batchSize;
      }

      console.log(`Completed bulk sync for ${event.entityType}`);
    } catch (error) {
      console.error('Bulk sync failed:', error);
      throw error;
    }
  }

  // Invalidate cache
  private async invalidateCache(event: SyncEventData): Promise<void> {
    try {
      // Clear related cache entries
      await db.delete(vectorSearchCache)
        .where(
          event.caseId 
            ? eq(vectorSearchCache.caseId, event.caseId)
            : isNull(vectorSearchCache.caseId)
        );

      console.log('Cache invalidated for', event.entityType);
    } catch (error) {
      console.error('Failed to invalidate cache:', error);
    }
  }

  // Retry failed event
  private async retryEvent(event: SyncEventData, attempt = 1): Promise<void> {
    if (attempt > this.options.maxRetries) {
      console.error('Max retries reached for event:', event);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, this.options.retryDelay * attempt));
    
    try {
      await this.processSyncEvent(event);
    } catch (error) {
      await this.retryEvent(event, attempt + 1);
    }
  }

  // Poll for changes (development mode)
  private async pollForChanges(): Promise<void> {
    try {
      const recentEmbeddings = await db.select()
        .from(embeddings)
        .where(gte(embeddings.updatedAt, new Date(Date.now() - 30000))) // Last 30 seconds
        .limit(50);

      for (const embedding of recentEmbeddings) {
        this.queueSyncEvent({
          entityType: embedding.entityType,
          entityId: embedding.entityId,
          caseId: embedding.caseId || undefined,
          operation: 'entity_updated',
          timestamp: new Date(),
          priority: 'normal'
        });
      }
    } catch (error) {
      console.error('Failed to poll for changes:', error);
    }
  }

  // Perform full sync
  private async performFullSync(): Promise<void> {
    console.log('Starting full sync...');
    
    try {
      // Sync all embeddings to Qdrant
      const entityTypes = await db.selectDistinct({ entityType: embeddings.entityType })
        .from(embeddings);

      for (const { entityType } of entityTypes) {
        this.queueSyncEvent({
          entityType,
          entityId: '', // Not used for bulk sync
          operation: 'bulk_sync_requested',
          timestamp: new Date(),
          priority: 'low'
        });
      }

      console.log('Full sync queued successfully');
    } catch (error) {
      console.error('Full sync failed:', error);
    }
  }

  // Clean up expired cache
  private async cleanupExpiredCache(): Promise<void> {
    try {
      const result = await db.delete(vectorSearchCache)
        .where(gte(vectorSearchCache.expiresAt, new Date()));

      console.log(`Cleaned up ${result.rowsAffected} expired cache entries`);
    } catch (error) {
      console.error('Cache cleanup failed:', error);
    }
  }

  // Update metrics
  private updateMetrics(): void {
    this.emit('metrics', this.metrics);
  }

  // Get current metrics
  public getMetrics(): SyncMetrics {
    return { ...this.metrics };
  }

  // Stop the sync service
  public async stop(): Promise<void> {
    this.isRunning = false;
    
    // Clear intervals
    for (const [name, interval] of this.syncIntervals) {
      clearInterval(interval);
    }
    this.syncIntervals.clear();

    // Close connections
    if (this.redis) {
      await this.redis.disconnect();
    }

    console.log('Background sync service stopped');
  }

  // Public API methods
  public async syncEntity(entityType: string, entityId: string, caseId?: string): Promise<void> {
    this.queueSyncEvent({
      entityType,
      entityId,
      caseId,
      operation: 'entity_updated',
      timestamp: new Date(),
      priority: 'high'
    });
  }

  public async requestBulkSync(entityType: string, caseId?: string): Promise<void> {
    this.queueSyncEvent({
      entityType,
      entityId: '',
      caseId,
      operation: 'bulk_sync_requested',
      timestamp: new Date(),
      priority: 'normal'
    });
  }

  public async invalidateCacheForCase(caseId: string): Promise<void> {
    this.queueSyncEvent({
      entityType: 'cache',
      entityId: '',
      caseId,
      operation: 'cache_invalidated',
      timestamp: new Date(),
      priority: 'high'
    });
  }
}

// Singleton instance
export const backgroundSync = new BackgroundSyncService();

// Auto-initialize in production
if (!dev) {
  backgroundSync.initialize().catch(console.error);
}

export default backgroundSync;
