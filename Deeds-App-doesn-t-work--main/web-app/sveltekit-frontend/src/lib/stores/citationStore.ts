import { writable, type Writable } from 'svelte/store';
import Loki from 'lokijs';
import Fuse from 'fuse.js';
import { createMachine, interpret, type StateFrom } from 'xstate';
import type { CitationPoint, CitationSearchResult } from '$lib/data/types';

// IndexedDB adapter for browser persistence
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

class CitationStoreManager {
  private db: Loki;
  private citations: Collection<CitationPoint>;
  private fuse: Fuse<CitationPoint>;
  private store: Writable<CitationPoint[]>;
  private initialized = false;

  constructor() {
    this.store = writable([]);
    this.initializeDb();
  }

  private async initializeDb() {
    if (typeof window === 'undefined') {
      // SSR - create a mock store
      this.initialized = true;
      return;
    }

    this.db = new Loki('prosecutor-citations.db', {
      adapter: idbAdapter,
      autoload: true,
      autoloadCallback: () => this.onDbLoad(),
      autosave: true,
      autosaveInterval: 5000
    });
  }

  private onDbLoad() {
    let citations = this.db.getCollection('citations');
    if (!citations) {
      citations = this.db.addCollection('citations', {
        unique: ['id'],
        indices: ['label', 'sourceType', 'caseId', 'reportId', 'createdAt']
      });
    }
    this.citations = citations;
    this.updateFuse();
    this.updateStore();
    this.initialized = true;
  }

  private updateFuse() {
    if (!this.citations) return;
    const data = this.citations.find();
    this.fuse = new Fuse(data, {
      keys: [
        { name: 'label', weight: 2.0 },
        { name: 'content', weight: 1.0 },
        { name: 'tags', weight: 0.5 }
      ],
      threshold: 0.3,
      includeScore: true,
      includeMatches: true
    });
  }

  private updateStore() {
    if (!this.citations) return;
    const data = this.citations.chain()
      .simplesort('createdAt', { desc: true })
      .limit(100)
      .data();
    this.store.set(data);
  }

  // Public methods
  subscribe = this.store.subscribe;

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
      this.updateStore();
      this.db.saveDatabase();
    } catch (error) {
      console.error('Failed to load citations from server:', error);
    }
  }

  async addCitation(citation: Omit<CitationPoint, 'id' | 'createdAt' | 'synced'>) {
    if (!this.initialized) await this.loadFromServer();

    const newCitation: CitationPoint = {
      ...citation,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      synced: false
    };

    this.citations.insert(newCitation);
    this.updateFuse();
    this.updateStore();
    this.db.saveDatabase();

    // Background sync to server
    this.syncToServer([newCitation]);

    return newCitation;
  }

  async updateCitation(id: string, updates: Partial<CitationPoint>) {
    if (!this.initialized) await this.loadFromServer();

    const citation = this.citations.findOne({ id });
    if (!citation) return null;

    Object.assign(citation, updates, { synced: false });
    this.citations.update(citation);
    this.updateFuse();
    this.updateStore();
    this.db.saveDatabase();

    // Background sync to server
    this.syncToServer([citation]);

    return citation;
  }

  async deleteCitation(id: string) {
    if (!this.initialized) await this.loadFromServer();

    const citation = this.citations.findOne({ id });
    if (!citation) return false;

    this.citations.remove(citation);
    this.updateFuse();
    this.updateStore();
    this.db.saveDatabase();

    // Sync deletion to server
    try {
      await fetch(`/api/citations/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to delete citation on server:', error);
    }

    return true;
  }

  search(query: string, limit: number = 10): CitationSearchResult[] {
    if (!this.fuse || !query) {
      return this.citations?.find() || [];
    }

    return this.fuse.search(query, { limit }) as CitationSearchResult[];
  }

  getCitationsByCase(caseId: string): CitationPoint[] {
    if (!this.citations) return [];
    return this.citations.find({ caseId });
  }

  getCitationsByReport(reportId: string): CitationPoint[] {
    if (!this.citations) return [];
    return this.citations.find({ reportId });
  }

  getMostUsed(limit: number = 5): CitationPoint[] {
    if (!this.citations) return [];
    // This is a simplified version - in real implementation, you'd track usage
    return this.citations.chain()
      .simplesort('createdAt', { desc: true })
      .limit(limit)
      .data();
  }

  private async syncToServer(citations: CitationPoint[]) {
    for (const citation of citations) {
      try {
        const method = citation.synced ? 'PUT' : 'POST';
        const url = citation.synced ? `/api/citations/${citation.id}` : '/api/citations';
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(citation)
        });

        if (response.ok) {
          citation.synced = true;
          this.citations.update(citation);
        }
      } catch (error) {
        console.error('Failed to sync citation to server:', error);
      }
    }
    this.db.saveDatabase();
  }

  async syncAll() {
    if (!this.initialized) await this.loadFromServer();
    
    const unsynced = this.citations.find({ synced: false });
    if (unsynced.length > 0) {
      await this.syncToServer(unsynced);
    }
  }

  // Qdrant integration for semantic search
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
    } catch (error) {
      console.error('Failed to sync citations to Qdrant:', error);
    }
  }

  async semanticSearch(query: string, limit: number = 10): Promise<CitationPoint[]> {
    try {
      const response = await fetch('/api/qdrant/search-citations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit })
      });

      if (!response.ok) {
        throw new Error('Semantic search failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Semantic search failed, falling back to Fuse.js:', error);
      return this.search(query, limit).map(result => result.item);
    }
  }
}

// Export singleton instance
export const citationStore = new CitationStoreManager();
