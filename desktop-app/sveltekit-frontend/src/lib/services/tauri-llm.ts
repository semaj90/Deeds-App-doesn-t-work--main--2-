// Enhanced Tauri LLM Service with Legal-BERT Integration
// Extends the existing RAG system with local Rust-based LLM capabilities
import { invoke } from '@tauri-apps/api/tauri';

export interface LocalModel {
  id: string;
  name: string;
  type: 'embedding' | 'chat' | 'classification';
  domain: 'general' | 'legal' | 'medical' | 'technical';
  architecture: 'bert' | 'llama' | 'mistral' | 'legal-bert';
  dimensions?: number;
  maxTokens?: number;
  isLoaded: boolean;
  memoryUsage?: number;
}

export interface InferenceOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  contextWindow?: number;
}

export interface EmbeddingOptions {
  batchSize?: number;
  normalize?: boolean;
  poolingStrategy?: 'mean' | 'cls' | 'max';
}

class TauriLLMService {
  private availableModels: LocalModel[] = [];
  private isInitialized = false;
  private currentEmbeddingModel: string | null = null;
  private currentChatModel: string | null = null;

  // Initialize the Tauri LLM service
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if we're running in Tauri environment
      if (!window.__TAURI__) {
        console.log('Tauri not available - running in web mode');
        return;
      }

      // Get available models from Rust backend
      const models = await invoke<LocalModel[]>('list_llm_models');
      this.availableModels = models;

      // Auto-select best models for each task
      await this.selectOptimalModels();
      
      this.isInitialized = true;
      console.log('Tauri LLM Service initialized with', models.length, 'models');
    } catch (error) {
      console.error('Failed to initialize Tauri LLM service:', error);
    }
  }

  // Select optimal models based on domain and task
  private async selectOptimalModels(): Promise<void> {
    // Prefer legal-bert for embeddings in legal domain
    const legalEmbeddingModel = this.availableModels.find(
      model => model.architecture === 'legal-bert' && model.type === 'embedding'
    );
    if (legalEmbeddingModel) {
      this.currentEmbeddingModel = legalEmbeddingModel.id;
      await this.loadModel(legalEmbeddingModel.id);
    } else {
      // Fallback to Gemma3Q4_K_M if available
      const gemmaModel = this.availableModels.find(
        model => model.name.toLowerCase().includes('gemma') && model.type === 'chat'
      );
      if (gemmaModel) {
        this.currentChatModel = gemmaModel.id;
        await this.loadModel(gemmaModel.id);
      } else {
        // Fallback to general BERT model
        const generalEmbeddingModel = this.availableModels.find(
          model => model.architecture === 'bert' && model.type === 'embedding'
        );
        if (generalEmbeddingModel) {
          this.currentEmbeddingModel = generalEmbeddingModel.id;
          await this.loadModel(generalEmbeddingModel.id);
        }
      }
    }

    // Select chat model (prefer local Llama/Mistral for legal domain, then Gemma)
    const legalChatModel = this.availableModels.find(
      model => model.type === 'chat' && model.domain === 'legal'
    );
    if (legalChatModel) {
      this.currentChatModel = legalChatModel.id;
      await this.loadModel(legalChatModel.id);
    } else {
      // Fallback to Gemma3Q4_K_M if available
      const gemmaModel = this.availableModels.find(
        model => model.name.toLowerCase().includes('gemma') && model.type === 'chat'
      );
      if (gemmaModel) {
        this.currentChatModel = gemmaModel.id;
        await this.loadModel(gemmaModel.id);
      }
    }
  }

  // Load a specific model into memory
  async loadModel(modelId: string): Promise<boolean> {
    try {
      const result = await invoke<boolean>('load_model', { modelId });
      
      // Update model status
      const model = this.availableModels.find(m => m.id === modelId);
      if (model) {
        model.isLoaded = result;
      }
      
      return result;
    } catch (error) {
      console.error(`Failed to load model ${modelId}:`, error);
      return false;
    }
  }

  // Generate embeddings using local legal-bert
  async generateEmbedding(
    text: string | string[], 
    options: EmbeddingOptions = {}
  ): Promise<number[] | number[][]> {
    if (!this.isInitialized || !this.currentEmbeddingModel) {
      throw new Error('Embedding model not available');
    }

    try {
      const result = await invoke<number[] | number[][]>('generate_embedding', {
        modelId: this.currentEmbeddingModel,
        text: Array.isArray(text) ? text : [text],
        options: {
          batchSize: options.batchSize || 10,
          normalize: options.normalize !== false,
          poolingStrategy: options.poolingStrategy || 'mean'
        }
      });

      // Return single array for single input, array of arrays for batch
      return Array.isArray(text) ? result : (result as number[][])[0];
    } catch (error) {
      console.error('Local embedding generation failed:', error);
      throw error;
    }
  }

  // Run local LLM inference for chat/completion
  async runInference(
    prompt: string, 
    options: InferenceOptions = {}
  ): Promise<string> {
    if (!this.isInitialized || !this.currentChatModel) {
      throw new Error('Chat model not available');
    }

    try {
      return await invoke<string>('run_llm_inference', {
        modelId: this.currentChatModel,
        prompt,
        options: {
          temperature: options.temperature || 0.7,
          maxTokens: options.maxTokens || 512,
          topP: options.topP || 0.9,
          topK: options.topK || 40
        }
      });
    } catch (error) {
      console.error('Local LLM inference failed:', error);
      throw error;
    }
  }

  // Legal document classification using legal-bert
  async classifyLegalDocument(text: string): Promise<{
    category: string;
    confidence: number;
    subcategories: Array<{ name: string; confidence: number }>;
  }> {
    const classificationModel = this.availableModels.find(
      model => model.type === 'classification' && model.domain === 'legal'
    );

    if (!classificationModel) {
      throw new Error('Legal classification model not available');
    }

    try {
      return await invoke('classify_legal_document', {
        modelId: classificationModel.id,
        text
      });
    } catch (error) {
      console.error('Legal document classification failed:', error);
      throw error;
    }
  }

  // Get semantic similarity between legal texts
  async getLegalSimilarity(text1: string, text2: string): Promise<number> {
    if (!this.currentEmbeddingModel) {
      throw new Error('Embedding model not available');
    }

    try {
      const embeddings = await this.generateEmbedding([text1, text2]) as number[][];
      return await invoke<number>('calculate_cosine_similarity', {
        vector1: embeddings[0],
        vector2: embeddings[1]
      });
    } catch (error) {
      console.error('Similarity calculation failed:', error);
      throw error;
    }
  }

  // Batch processing for large document sets
  async batchProcessDocuments(
    documents: Array<{ id: string; text: string }>,
    operations: ('embed' | 'classify' | 'summarize')[]
  ): Promise<Array<{
    id: string;
    embedding?: number[];
    classification?: any;
    summary?: string;
    error?: string;
  }>> {
    try {
      return await invoke('batch_process_documents', {
        documents,
        operations,
        embeddingModelId: this.currentEmbeddingModel,
        chatModelId: this.currentChatModel
      });
    } catch (error) {
      console.error('Batch processing failed:', error);
      throw error;
    }
  }

  // Get model performance metrics
  async getModelMetrics(modelId: string): Promise<{
    memoryUsage: number;
    inferenceTime: number;
    tokensPerSecond: number;
    accuracy?: number;
  }> {
    try {
      return await invoke('get_model_metrics', { modelId });
    } catch (error) {
      console.error('Failed to get model metrics:', error);
      throw error;
    }
  }

  // Model management
  async unloadModel(modelId: string): Promise<boolean> {
    try {
      const result = await invoke<boolean>('unload_model', { modelId });
      
      const model = this.availableModels.find(m => m.id === modelId);
      if (model) {
        model.isLoaded = false;
      }
      
      return result;
    } catch (error) {
      console.error(`Failed to unload model ${modelId}:`, error);
      return false;
    }
  }

  // Check if Tauri is available
  isAvailable(): boolean {
    return this.isInitialized && !!window.__TAURI__;
  }

  // Get available models
  getAvailableModels(): LocalModel[] {
    return this.availableModels;
  }

  // Get current models
  getCurrentModels(): { embedding: string | null; chat: string | null } {
    return {
      embedding: this.currentEmbeddingModel,
      chat: this.currentChatModel
    };
  }

  // Switch models
  async switchEmbeddingModel(modelId: string): Promise<boolean> {
    const model = this.availableModels.find(m => m.id === modelId && m.type === 'embedding');
    if (!model) {
      throw new Error(`Embedding model ${modelId} not found`);
    }

    // Unload current model if different
    if (this.currentEmbeddingModel && this.currentEmbeddingModel !== modelId) {
      await this.unloadModel(this.currentEmbeddingModel);
    }

    // Load new model
    const loaded = await this.loadModel(modelId);
    if (loaded) {
      this.currentEmbeddingModel = modelId;
    }
    
    return loaded;
  }

  async switchChatModel(modelId: string): Promise<boolean> {
    const model = this.availableModels.find(m => m.id === modelId && m.type === 'chat');
    if (!model) {
      throw new Error(`Chat model ${modelId} not found`);
    }

    // Unload current model if different
    if (this.currentChatModel && this.currentChatModel !== modelId) {
      await this.unloadModel(this.currentChatModel);
    }

    // Load new model
    const loaded = await this.loadModel(modelId);
    if (loaded) {
      this.currentChatModel = modelId;
    }
    
    return loaded;
  }
}

// Singleton instance
export const tauriLLM = new TauriLLMService();

// Initialize on module load
tauriLLM.initialize().catch(console.error);

// Export legacy functions for backward compatibility
export async function getAvailableModels(): Promise<string[]> {
  await tauriLLM.initialize();
  return tauriLLM.getAvailableModels().map(model => model.id);
}

export async function runInference(model: string, prompt: string): Promise<string> {
  await tauriLLM.initialize();
  
  // Switch to specified model if different from current
  if (tauriLLM.getCurrentModels().chat !== model) {
    await tauriLLM.switchChatModel(model);
  }
  
  return tauriLLM.runInference(prompt);
}

export default tauriLLM;
