/**
 * Qdrant Vector Database Integration for Canvas Text Embeddings
 * 
 * This module provides:
 * - Text extraction from canvas objects
 * - Embedding generation using local/cloud embedding models
 * - Vector storage and retrieval in Qdrant
 * - Semantic search and similarity matching
 * - Canvas metadata indexing
 */

import { QdrantClient } from '@qdrant/js-client-rest';
import { browser } from '$app/environment';

// Types for our embedding system
export interface CanvasTextItem {
	id: string;
	canvasId: string;
	caseId: string;
	objectId: string;
	text: string;
	position: { x: number; y: number };
	fontSize: number;
	fontFamily: string;
	color: string;
	isEvidence: boolean;
	timestamp: number;
	metadata?: Record<string, any>;
}

export interface EmbeddingResult {
	id: string;
	text: string;
	vector: number[];
	score?: number;
	metadata: CanvasTextItem;
}

export interface SearchResult {
	items: EmbeddingResult[];
	total: number;
	query: string;
	processingTime: number;
}

export interface EmbeddingConfig {
	collectionName: string;
	vectorSize: number;
	distance: 'Cosine' | 'Euclidean' | 'Dot';
	batchSize: number;
	similarityThreshold: number;
}

// Default configuration
const DEFAULT_CONFIG: EmbeddingConfig = {
	collectionName: 'canvas_text_embeddings',
	vectorSize: 384, // For sentence-transformers/all-MiniLM-L6-v2
	distance: 'Cosine',
	batchSize: 50,
	similarityThreshold: 0.7
};

/**
 * Qdrant Vector Database Service
 */
export class QdrantEmbeddingService {
	private client: QdrantClient | null = null;
	private config: EmbeddingConfig;
	private isInitialized = false;
	private embeddingCache = new Map<string, number[]>();

	constructor(config: Partial<EmbeddingConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	/**
	 * Initialize the Qdrant client and ensure collection exists
	 */
	async initialize(qdrantUrl: string = 'http://localhost:6333'): Promise<void> {
		if (browser) {
			console.warn('Qdrant service should not be initialized in browser context');
			return;
		}

		try {
			this.client = new QdrantClient({ url: qdrantUrl });

			// Check if collection exists, create if not
			const collections = await this.client.getCollections();
			const collectionExists = collections.collections.some(
				c => c.name === this.config.collectionName
			);

			if (!collectionExists) {
				await this.createCollection();
			}

			this.isInitialized = true;
			console.log(`Qdrant embedding service initialized with collection: ${this.config.collectionName}`);
		} catch (error) {
			console.error('Failed to initialize Qdrant service:', error);
			throw error;
		}
	}

	/**
	 * Create the embeddings collection in Qdrant
	 */
	private async createCollection(): Promise<void> {
		if (!this.client) throw new Error('Qdrant client not initialized');

		await this.client.createCollection(this.config.collectionName, {
			vectors: {
				size: this.config.vectorSize,
				distance: this.config.distance
			},
			optimizers_config: {
				default_segment_number: 2
			},
			replication_factor: 1
		});

		// Create payload indexes for efficient filtering
		await this.client.createPayloadIndex(this.config.collectionName, {
			field_name: 'canvasId',
			field_schema: 'keyword'
		});

		await this.client.createPayloadIndex(this.config.collectionName, {
			field_name: 'caseId',
			field_schema: 'keyword'
		});

		await this.client.createPayloadIndex(this.config.collectionName, {
			field_name: 'isEvidence',
			field_schema: 'bool'
		});

		await this.client.createPayloadIndex(this.config.collectionName, {
			field_name: 'timestamp',
			field_schema: 'integer'
		});

		console.log(`Created Qdrant collection: ${this.config.collectionName}`);
	}

	/**
	 * Generate embeddings for text using a local/cloud embedding model
	 */
	async generateEmbedding(text: string): Promise<number[]> {
		// Check cache first
		const cacheKey = this.hashText(text);
		if (this.embeddingCache.has(cacheKey)) {
			return this.embeddingCache.get(cacheKey)!;
		}

		try {
			// For now, use a mock embedding API call
			// In production, you would call your embedding service:
			// - OpenAI embeddings API
			// - HuggingFace transformers
			// - Local sentence-transformers model
			// - Custom embedding endpoint

			const embedding = await this.callEmbeddingAPI(text);
			
			// Cache the result
			this.embeddingCache.set(cacheKey, embedding);
			
			return embedding;
		} catch (error) {
			console.error('Failed to generate embedding:', error);
			// Return a zero vector as fallback
			return new Array(this.config.vectorSize).fill(0);
		}
	}

	/**
	 * Call embedding API (placeholder implementation)
	 */
	private async callEmbeddingAPI(text: string): Promise<number[]> {
		// Mock implementation - replace with actual embedding service
		// Example: OpenAI, HuggingFace, or local transformers
		
		// Simulate API call delay
		await new Promise(resolve => setTimeout(resolve, 100));
		
		// Generate a mock embedding vector
		// In production, this would be a real embedding from your model
		const embedding = [];
		const seed = this.hashText(text);
		const rng = this.seedRandom(seed);
		
		for (let i = 0; i < this.config.vectorSize; i++) {
			embedding.push((rng() - 0.5) * 2); // Random between -1 and 1
		}
		
		// Normalize the vector
		const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
		return embedding.map(val => val / magnitude);
	}

	/**
	 * Extract text items from canvas JSON
	 */
	extractTextItems(canvasJson: any, canvasId: string, caseId: string): CanvasTextItem[] {
		const textItems: CanvasTextItem[] = [];

		if (!canvasJson.objects) return textItems;

		for (const obj of canvasJson.objects) {
			if (obj.type === 'textbox' || obj.type === 'text') {
				const item: CanvasTextItem = {
					id: `${canvasId}_${obj.id || Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
					canvasId,
					caseId,
					objectId: obj.id || 'unknown',
					text: obj.text || '',
					position: { x: obj.left || 0, y: obj.top || 0 },
					fontSize: obj.fontSize || 12,
					fontFamily: obj.fontFamily || 'Arial',
					color: obj.fill || '#000000',
					isEvidence: obj.data?.isEvidence || false,
					timestamp: Date.now(),
					metadata: {
						width: obj.width,
						height: obj.height,
						angle: obj.angle || 0,
						scaleX: obj.scaleX || 1,
						scaleY: obj.scaleY || 1,
						opacity: obj.opacity || 1
					}
				};

				if (item.text.trim().length > 0) {
					textItems.push(item);
				}
			}
		}

		return textItems;
	}

	/**
	 * Index canvas text items in Qdrant
	 */
	async indexTextItems(textItems: CanvasTextItem[]): Promise<void> {
		if (!this.isInitialized || !this.client) {
			throw new Error('Qdrant service not initialized');
		}

		if (textItems.length === 0) return;

		// Process in batches
		for (let i = 0; i < textItems.length; i += this.config.batchSize) {
			const batch = textItems.slice(i, i + this.config.batchSize);
			await this.processBatch(batch);
		}

		console.log(`Indexed ${textItems.length} text items in Qdrant`);
	}

	/**
	 * Process a batch of text items
	 */
	private async processBatch(batch: CanvasTextItem[]): Promise<void> {
		const points = [];

		for (const item of batch) {
			const embedding = await this.generateEmbedding(item.text);
			
			points.push({
				id: item.id,
				vector: embedding,
				payload: {
					...item,
					vector: undefined // Don't store vector in payload
				}
			});
		}

		await this.client!.upsert(this.config.collectionName, {
			wait: true,
			points
		});
	}

	/**
	 * Search for similar text items
	 */
	async searchSimilar(
		query: string, 
		options: {
			limit?: number;
			canvasId?: string;
			caseId?: string;
			isEvidence?: boolean;
			threshold?: number;
		} = {}
	): Promise<SearchResult> {
		if (!this.isInitialized || !this.client) {
			throw new Error('Qdrant service not initialized');
		}

		const startTime = Date.now();
		const {
			limit = 10,
			canvasId,
			caseId,
			isEvidence,
			threshold = this.config.similarityThreshold
		} = options;

		// Generate query embedding
		const queryVector = await this.generateEmbedding(query);

		// Build filter conditions
		const filter: any = {
			must: []
		};

		if (canvasId) {
			filter.must.push({ key: 'canvasId', match: { value: canvasId } });
		}

		if (caseId) {
			filter.must.push({ key: 'caseId', match: { value: caseId } });
		}

		if (isEvidence !== undefined) {
			filter.must.push({ key: 'isEvidence', match: { value: isEvidence } });
		}

		// Perform vector search
		const searchResult = await this.client.search(this.config.collectionName, {
			vector: queryVector,
			filter: filter.must.length > 0 ? filter : undefined,
			limit,
			score_threshold: threshold,
			with_payload: true
		});

		const items: EmbeddingResult[] = searchResult.map(point => ({
			id: point.id as string,
			text: (point.payload as any).text,
			vector: queryVector, // Use query vector for consistency
			score: point.score,
			metadata: point.payload as CanvasTextItem
		}));

		const processingTime = Date.now() - startTime;

		return {
			items,
			total: items.length,
			query,
			processingTime
		};
	}

	/**
	 * Update canvas embeddings
	 */
	async updateCanvasEmbeddings(canvasJson: any, canvasId: string, caseId: string): Promise<void> {
		// First, remove existing embeddings for this canvas
		await this.removeCanvasEmbeddings(canvasId);

		// Extract and index new text items
		const textItems = this.extractTextItems(canvasJson, canvasId, caseId);
		await this.indexTextItems(textItems);
	}

	/**
	 * Remove embeddings for a specific canvas
	 */
	async removeCanvasEmbeddings(canvasId: string): Promise<void> {
		if (!this.isInitialized || !this.client) {
			throw new Error('Qdrant service not initialized');
		}

		await this.client.delete(this.config.collectionName, {
			filter: {
				must: [{ key: 'canvasId', match: { value: canvasId } }]
			}
		});
	}

	/**
	 * Get embeddings statistics
	 */
	async getStats(): Promise<{
		totalPoints: number;
		collectionInfo: any;
		cacheSize: number;
	}> {
		if (!this.isInitialized || !this.client) {
			throw new Error('Qdrant service not initialized');
		}

		const collectionInfo = await this.client.getCollection(this.config.collectionName);

		return {
			totalPoints: collectionInfo.points_count || 0,
			collectionInfo,
			cacheSize: this.embeddingCache.size
		};
	}

	/**
	 * Utility functions
	 */
	private hashText(text: string): string {
		let hash = 0;
		for (let i = 0; i < text.length; i++) {
			const char = text.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32-bit integer
		}
		return hash.toString();
	}

	private seedRandom(seed: string): () => number {
		let hashCode = 0;
		for (let i = 0; i < seed.length; i++) {
			const char = seed.charCodeAt(i);
			hashCode = ((hashCode << 5) - hashCode) + char;
			hashCode = hashCode & hashCode;
		}
		
		return function() {
			hashCode = ((hashCode * 9301) + 49297) % 233280;
			return hashCode / 233280;
		};
	}
}

/**
 * Global embedding service instance
 */
export const embeddingService = new QdrantEmbeddingService();

/**
 * Initialize embedding service (call this in your server startup)
 */
export async function initializeEmbeddingService(qdrantUrl?: string): Promise<void> {
	await embeddingService.initialize(qdrantUrl);
}

/**
 * Utility functions for client-side usage
 */
export const EmbeddingUtils = {
	// Extract text for embedding without full canvas processing
	extractCanvasText(canvasJson: any): string[] {
		const texts: string[] = [];
		
		if (!canvasJson.objects) return texts;

		for (const obj of canvasJson.objects) {
			if ((obj.type === 'textbox' || obj.type === 'text') && obj.text) {
				texts.push(obj.text.trim());
			}
		}

		return texts.filter(text => text.length > 0);
	},

	// Generate search suggestions based on existing embeddings
	async generateSearchSuggestions(
		query: string, 
		canvasId?: string, 
		limit: number = 5
	): Promise<string[]> {
		try {
			const response = await fetch('/api/embeddings/suggest', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query, canvasId, limit })
			});

			if (response.ok) {
				const data = await response.json();
				return data.suggestions || [];
			}
		} catch (error) {
			console.error('Failed to get search suggestions:', error);
		}

		return [];
	},

	// Search canvas embeddings from client
	async searchCanvasEmbeddings(
		query: string,
		options: {
			canvasId?: string;
			caseId?: string;
			isEvidence?: boolean;
			limit?: number;
		} = {}
	): Promise<SearchResult | null> {
		try {
			const response = await fetch('/api/embeddings/search', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query, ...options })
			});

			if (response.ok) {
				return await response.json();
			}
		} catch (error) {
			console.error('Failed to search embeddings:', error);
		}

		return null;
	}
};
