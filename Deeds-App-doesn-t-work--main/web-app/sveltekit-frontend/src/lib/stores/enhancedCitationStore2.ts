import { writable, derived, type Writable } from 'svelte/store';
import { createMachine, interpret, assign, type StateFrom } from 'xstate';
import Loki from 'lokijs';
import Fuse from 'fuse.js';
import { v4 as uuidv4 } from 'uuid';
import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';
import type { 
  CitationPoint, 
  CitationSearchResult, 
  AIAnalysis, 
  Report, 
  EditorState,
  CanvasState,
  AutocompleteState
} from '../data/types.js';

// --- Enhanced Types for AI Integration ---
export type AIPromptAction = {
  type: 'next_paragraph' | 'citation_suggestion' | 'legal_analysis' | 'evidence_summary' | 'tell_me_what_to_do';
  context: {
    currentContent: string;
    selectedText?: string;
    caseId?: string;
    reportId?: string;
    evidenceIds?: string[];
    userProfile?: UserProfile;
  };
  priority: 'low' | 'medium' | 'high';
};

export type UserProfile = {
  id: string;
  preferences: {
    citationStyle: 'bluebook' | 'apa' | 'mla' | 'custom';
    aiSuggestionsEnabled: boolean;
    autoSaveInterval: number;
    preferredTemplates: string[];
  };
  workPatterns: {
    commonCitations: CitationPoint[];
    frequentPhrases: string[];
    writingStyle?: string;
    avgWordsPerParagraph?: number;
  };
  memory: {
    recentActions: UserAction[];
    searchHistory: string[];
    aiInteractions: AIInteraction[];
  };
};

export type UserAction = {
  id: string;
  type: 'citation_added' | 'text_edited' | 'ai_suggestion_accepted' | 'canvas_modified';
  timestamp: string;
  context: any;
  embedding?: number[];
};

export type AIInteraction = {
  id: string;
  prompt: string;
  response: string;
  type: AIPromptAction['type'];
  timestamp: string;
  feedback?: 'helpful' | 'not_helpful' | 'partially_helpful';
  embedding?: number[];
};

export type NotificationState = {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'ai_suggestion';
  title: string;
  message: string;
  timestamp: string;
  action?: {
    label: string;
    handler: () => void;
  };
  autoRemove?: boolean;
  duration?: number;
};

export type EvidenceAnalysis = {
  id: string;
  imageId: string;
  faces: Array<{
    id: string;
    boundingBox: { x: number; y: number; width: number; height: number };
    confidence: number;
    features: any;
  }>;
  objects: Array<{
    id: string;
    type: string;
    boundingBox: { x: number; y: number; width: number; height: number };
    confidence: number;
  }>;
  tags: string[];
  metadata: any;
  createdAt: string;
};

// --- IndexedDB Adapter ---
const idbAdapter = {
  loadDatabase: (dbname: string, callback: (value: any) => void) => {
    const request = indexedDB.open(dbname, 1);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['loki'], 'readonly');
      const store = transaction.objectStore('loki');
      const getReq = store.get(1);
      getReq.onsuccess = () => callback(getReq.result?.data || null);
      getReq.onerror = () => callback(null);
    };
    request.onerror = () => callback(null);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('loki')) {
        db.createObjectStore('loki');
      }
    };
  },
  saveDatabase: (dbname: string, dbstring: string, callback: () => void) => {
    const request = indexedDB.open(dbname, 1);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['loki'], 'readwrite');
      const store = transaction.objectStore('loki');
      store.put({ data: dbstring }, 1);
      transaction.oncomplete = callback;
    };
    request.onerror = callback;
  }
};

// --- Enhanced Citation Store Manager ---
class EnhancedCitationStore {
  private db!: Loki;
  private citations!: Collection<CitationPoint>;
  private userProfiles!: Collection<UserProfile>;
  private aiAnalyses!: Collection<AIAnalysis>;
  private fuse!: Fuse<CitationPoint>;

  // Svelte stores
  public citations$ = writable<CitationPoint[]>([]);
  public searchResults$ = writable<CitationSearchResult[]>([]);
  public selectedCitation$ = writable<CitationPoint | null>(null);
  public notifications$ = writable<NotificationState[]>([]);
  public aiSuggestions$ = writable<AIAnalysis[]>([]);
  public isProcessingAI$ = writable<boolean>(false);
  public userProfile$ = writable<UserProfile | null>(null);
  public editorState$ = writable<EditorState>({
    content: '',
    autocomplete: {
      state: 'idle',
      query: '',
      suggestions: [],
      selectedIndex: -1
    },
    ai: {
      isAnalyzing: false,
      suggestions: []
    }
  });

  // Derived stores
  public recentCitations$ = derived(this.citations$, ($citations) => 
    $citations.slice(0, 10)
  );

  public frequentCitations$ = derived(this.citations$, ($citations) => 
    $citations.filter(c => c.tags.includes('frequent')).slice(0, 5)
  );

  private initialized = false;
  private debouncedSave = debounce(this.saveToDatabase.bind(this), 2000);
  private throttledSync = throttle(this.syncToServer.bind(this), 30000);

  constructor() {
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    if (typeof window === 'undefined') {
      this.initialized = true;
      return;
    }

    this.db = new Loki('enhanced-prosecutor-citations.db', {
      adapter: idbAdapter,
      autoload: true,
      autoloadCallback: () => this.onDbLoad(),
      autosave: true,
      autosaveInterval: 5000
    });
  }

  private onDbLoad() {
    this.citations = this.db.getCollection('citations') || 
      this.db.addCollection('citations', {
        unique: ['id'],
        indices: ['label', 'sourceType', 'caseId', 'reportId', 'createdAt', 'tags']
      });

    this.userProfiles = this.db.getCollection('userProfiles') || 
      this.db.addCollection('userProfiles', {
        unique: ['id']
      });

    this.aiAnalyses = this.db.getCollection('aiAnalyses') || 
      this.db.addCollection('aiAnalyses', {
        unique: ['id'],
        indices: ['reportId', 'analysisType']
      });

    this.updateFuse();
    this.updateStores();
    this.initialized = true;
  }

  private updateFuse() {
    if (!this.citations) return;
    const data = this.citations.find();
    this.fuse = new Fuse(data, {
      keys: [
        { name: 'label', weight: 2.0 },
        { name: 'content', weight: 1.5 },
        { name: 'tags', weight: 1.0 },
        { name: 'sourceType', weight: 0.5 }
      ],
      threshold: 0.4,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2
    });
  }

  private updateStores() {
    if (!this.citations) return;
    const data = this.citations.chain()
      .simplesort('createdAt', { desc: true })
      .limit(100)
      .data();
    this.citations$.set(data);
  }

  // --- Public API Methods ---

  // Subscribe methods for Svelte components
  subscribe = this.citations$.subscribe;
  subscribeToNotifications = this.notifications$.subscribe;
  subscribeToAISuggestions = this.aiSuggestions$.subscribe;
  subscribeToProcessingStatus = this.isProcessingAI$.subscribe;

  // Enhanced search with hybrid fuzzy + semantic approach
  async search(query: string, options: {
    limit?: number;
    includeSemanticSearch?: boolean;
    filters?: Partial<CitationPoint>;
  } = {}): Promise<CitationSearchResult[]> {
    const { limit = 10, includeSemanticSearch = true, filters } = options;

    if (!query.trim()) {
      const filtered = filters ? this.citations.find(filters) : this.citations.find();
      return filtered.slice(0, limit).map(item => ({ item, score: 0, matches: [] }));
    }

    // Fuzzy search with Fuse.js
    const fuseResults = this.fuse?.search(query, { limit: limit * 2 }) || [];
    
    // Semantic search if enabled
    let semanticResults: CitationPoint[] = [];
    if (includeSemanticSearch) {
      try {
        semanticResults = await this.performSemanticSearch(query, limit);
      } catch (error) {
        console.warn('Semantic search failed, using fuzzy results only:', error);
      }
    }

    // Combine and deduplicate results
    const combined = this.combineSearchResults(fuseResults, semanticResults, limit);
    this.searchResults$.set(combined);

    return combined;
  }

  // AI-powered "Tell me what to do" prompt
  async tellMeWhatToDo(context: {
    currentContent?: string;
    selectedText?: string;
    caseId?: string;
    reportId?: string;
  }): Promise<AIAnalysis> {
    this.isProcessingAI$.set(true);

    try {
      const response = await fetch('/api/ai/tell-me-what-to-do', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context,
          userProfile: await this.getCurrentUserProfile()
        })
      });

      if (!response.ok) throw new Error('AI guidance failed');

      const analysis: AIAnalysis = await response.json();
      
      await this.saveAIInteraction({
        prompt: 'Tell me what to do',
        response: analysis.output,
        type: 'tell_me_what_to_do',
        feedback: undefined
      });

      this.showNotification({
        type: 'ai_suggestion',
        title: 'AI Guidance Ready',
        message: 'Here are some suggestions for your next steps',
        action: {
          label: 'View Details',
          handler: () => console.log('Show AI guidance details')
        }
      });

      return analysis;
    } catch (error) {
      console.error('AI guidance failed:', error);
      this.showNotification({
        type: 'error',
        title: 'AI Guidance Failed',
        message: 'Unable to generate guidance at this time'
      });
      throw error;
    } finally {
      this.isProcessingAI$.set(false);
    }
  }

  // Generate next paragraph suggestions
  async suggestNextParagraph(context: {
    currentContent: string;
    cursorPosition: number;
    caseId?: string;
    reportId?: string;
  }): Promise<string[]> {
    this.isProcessingAI$.set(true);

    try {
      const response = await fetch('/api/ai/suggest-next-paragraph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...context,
          userProfile: await this.getCurrentUserProfile()
        })
      });

      if (!response.ok) throw new Error('Next paragraph suggestion failed');

      const { suggestions } = await response.json();
      
      this.editorState$.update(state => ({
        ...state,
        ai: {
          ...state.ai,
          suggestions,
          isAnalyzing: false
        }
      }));

      return suggestions;
    } catch (error) {
      console.error('Next paragraph suggestion failed:', error);
      return [];
    } finally {
      this.isProcessingAI$.set(false);
    }
  }

  // Generate citation suggestions based on current context
  async suggestCitations(context: {
    currentText: string;
    selectedText?: string;
    caseId?: string;
    reportId?: string;
  }): Promise<CitationPoint[]> {
    try {
      const response = await fetch('/api/ai/suggest-citations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context)
      });

      if (!response.ok) throw new Error('Citation suggestion failed');

      const suggestions: CitationPoint[] = await response.json();
      
      this.showNotification({
        type: 'ai_suggestion',
        title: 'Citation Suggestions',
        message: `Found ${suggestions.length} relevant citations for your text`
      });

      return suggestions;
    } catch (error) {
      console.error('Citation suggestion failed:', error);
      return [];
    }
  }

  // Hover summary for citations
  async getHoverSummary(citationId: string): Promise<string> {
    try {
      const citation = this.citations.findOne({ id: citationId });
      if (!citation) throw new Error('Citation not found');

      const response = await fetch('/api/ai/hover-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citation,
          context: 'hover_preview'
        })
      });

      if (!response.ok) throw new Error('Hover summary failed');

      const { summary } = await response.json();
      return summary;
    } catch (error) {
      console.error('Hover summary failed:', error);
      return 'Summary unavailable';
    }
  }

  // Auto-populate citation fields using NLP
  async autoPopulateCitation(rawText: string): Promise<Partial<CitationPoint>> {
    try {
      const response = await fetch('/api/ai/parse-citation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText })
      });

      if (!response.ok) throw new Error('Citation parsing failed');

      const parsed = await response.json();
      return parsed;
    } catch (error) {
      console.error('Auto-populate citation failed:', error);
      return {};
    }
  }

  // Evidence image analysis
  async analyzeEvidenceImage(imageFile: File): Promise<EvidenceAnalysis> {
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await fetch('/api/ai/analyze-evidence', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Evidence analysis failed');

      const analysis: EvidenceAnalysis = await response.json();
      
      this.showNotification({
        type: 'success',
        title: 'Evidence Analysis Complete',
        message: `Detected ${analysis.objects.length} objects and ${analysis.faces.length} faces`
      });

      return analysis;
    } catch (error) {
      console.error('Evidence analysis failed:', error);
      throw error;
    }
  }

  // Add citation with AI enhancement
  async addCitation(citation: Omit<CitationPoint, 'id' | 'createdAt' | 'synced' | 'embedding'>): Promise<CitationPoint> {
    const enhancedCitation: CitationPoint = {
      ...citation,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      synced: false,
      embedding: await this.generateEmbedding(citation.content)
    };

    this.citations.insert(enhancedCitation);
    this.updateFuse();
    this.updateStores();
    this.debouncedSave();

    await this.trackUserAction('citation_added', { citationId: enhancedCitation.id });
    this.suggestRelatedCitations(enhancedCitation);

    this.showNotification({
      type: 'success',
      title: 'Citation Added',
      message: `Added citation "${enhancedCitation.label}"`
    });

    return enhancedCitation;
  }

  // Export to PDF using Playwright
  async exportToPDF(reportId: string, options: {
    includeCanvas?: boolean;
    template?: string;
  } = {}): Promise<{ url: string; filename: string }> {
    try {
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          options
        })
      });

      if (!response.ok) throw new Error('PDF export failed');

      const result = await response.json();
      
      this.showNotification({
        type: 'success',
        title: 'PDF Export Complete',
        message: 'Your report has been exported successfully',
        action: {
          label: 'Download',
          handler: () => window.open(result.url, '_blank')
        }
      });

      return result;
    } catch (error) {
      console.error('PDF export failed:', error);
      throw error;
    }
  }

  // Load citations from server
  async loadFromServer() {
    if (!this.initialized) {
      await new Promise(resolve => {
        const checkInit = () => {
          if (this.initialized) resolve(null);
          else setTimeout(checkInit, 50);
        };
        checkInit();
      });
    }

    try {
      const response = await fetch('/api/citations');
      const serverCitations: CitationPoint[] = await response.json();
      
      serverCitations.forEach(citation => {
        const existing = this.citations.findOne({ id: citation.id });
        if (existing) {
          Object.assign(existing, { ...citation, synced: true });
          this.citations.update(existing);
        } else {
          this.citations.insert({ ...citation, synced: true });
        }
      });

      this.updateFuse();
      this.updateStores();
      this.saveToDatabase();
    } catch (error) {
      console.error('Failed to load citations from server:', error);
    }
  }

  // Sync to Qdrant
  async syncToQdrant() {
    if (!this.initialized) await this.loadFromServer();

    try {
      const citations = this.citations.find();
      const response = await fetch('/api/qdrant/sync-citations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ citations })
      });

      if (!response.ok) {
        throw new Error('Failed to sync with Qdrant');
      }

      this.showNotification({
        type: 'success',
        title: 'Sync Complete',
        message: 'Citations synced to vector database'
      });
    } catch (error) {
      console.error('Failed to sync citations to Qdrant:', error);
      this.showNotification({
        type: 'error',
        title: 'Sync Failed',
        message: 'Failed to sync citations to vector database'
      });
    }
  }

  // --- Private Helper Methods ---

  private combineSearchResults(
    fuseResults: any[], 
    semanticResults: CitationPoint[], 
    limit: number
  ): CitationSearchResult[] {
    const resultMap = new Map<string, CitationSearchResult>();
    
    fuseResults.forEach(result => {
      resultMap.set(result.item.id, result as CitationSearchResult);
    });

    semanticResults.forEach(item => {
      if (!resultMap.has(item.id)) {
        resultMap.set(item.id, {
          item,
          score: 0.8,
          matches: []
        });
      }
    });

    return Array.from(resultMap.values())
      .sort((a, b) => (a.score || 0) - (b.score || 0))
      .slice(0, limit);
  }

  private async performSemanticSearch(query: string, limit: number): Promise<CitationPoint[]> {
    try {
      const response = await fetch('/api/qdrant/search-citations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit })
      });

      if (!response.ok) throw new Error('Semantic search failed');
      return await response.json();
    } catch (error) {
      console.error('Qdrant semantic search failed:', error);
      return [];
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch('/api/ai/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) throw new Error('Embedding generation failed');
      const { embedding } = await response.json();
      return embedding;
    } catch (error) {
      console.error('Embedding generation failed:', error);
      return [];
    }
  }

  private async suggestRelatedCitations(citation: CitationPoint) {
    setTimeout(async () => {
      try {
        const related = await this.search(citation.content, { 
          limit: 3, 
          includeSemanticSearch: true 
        });

        if (related.length > 0) {
          this.showNotification({
            type: 'info',
            title: 'Related Citations Found',
            message: `Found ${related.length} citations related to "${citation.label}"`
          });
        }
      } catch (error) {
        console.error('Related citation suggestion failed:', error);
      }
    }, 1000);
  }

  private async trackUserAction(type: UserAction['type'], context: any) {
    const action: UserAction = {
      id: uuidv4(),
      type,
      timestamp: new Date().toISOString(),
      context,
      embedding: await this.generateEmbedding(JSON.stringify(context))
    };

    this.userProfile$.update(profile => {
      if (!profile) return profile;
      
      return {
        ...profile,
        memory: {
          ...profile.memory,
          recentActions: [action, ...profile.memory.recentActions].slice(0, 100)
        }
      };
    });
  }

  private async saveAIInteraction(interaction: Omit<AIInteraction, 'id' | 'timestamp' | 'embedding'>) {
    const fullInteraction: AIInteraction = {
      ...interaction,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      embedding: await this.generateEmbedding(interaction.prompt)
    };

    this.userProfile$.update(profile => {
      if (!profile) return profile;
      
      return {
        ...profile,
        memory: {
          ...profile.memory,
          aiInteractions: [fullInteraction, ...profile.memory.aiInteractions].slice(0, 50)
        }
      };
    });
  }

  private async getCurrentUserProfile(): Promise<UserProfile | null> {
    return new Promise(resolve => {
      const unsubscribe = this.userProfile$.subscribe(profile => {
        unsubscribe();
        resolve(profile);
      });
    });
  }

  private showNotification(notification: Omit<NotificationState, 'id' | 'timestamp'>) {
    const fullNotification: NotificationState = {
      ...notification,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      autoRemove: notification.autoRemove ?? true,
      duration: notification.duration ?? 4000
    };

    this.notifications$.update(notifications => [
      fullNotification,
      ...notifications
    ]);

    // Auto-remove notification if specified
    if (fullNotification.autoRemove) {
      setTimeout(() => {
        this.notifications$.update(notifications =>
          notifications.filter(n => n.id !== fullNotification.id)
        );
      }, fullNotification.duration);
    }
  }

  private saveToDatabase() {
    if (this.db) {
      this.db.saveDatabase(() => {
        console.log('Database saved successfully');
      });
    }
  }

  private async syncToServer() {
    const unsynced = this.citations.find({ synced: false });
    if (unsynced.length === 0) return;

    try {
      for (const citation of unsynced) {
        const response = await fetch('/api/citations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(citation)
        });

        if (response.ok) {
          citation.synced = true;
          this.citations.update(citation);
        }
      }

      this.saveToDatabase();
      this.showNotification({
        type: 'success',
        title: 'Sync Complete',
        message: `Synced ${unsynced.length} citations to server`
      });
    } catch (error) {
      console.error('Sync to server failed:', error);
      this.showNotification({
        type: 'error',
        title: 'Sync Failed',
        message: 'Failed to sync citations to server'
      });
    }
  }

  destroy() {
    // Cleanup method for component unmounting
    console.log('Enhanced citation store destroyed');
  }
}

// Export singleton instance
export const enhancedCitationStore = new EnhancedCitationStore();

// Export the original store for backwards compatibility
export const citationStore = enhancedCitationStore;
