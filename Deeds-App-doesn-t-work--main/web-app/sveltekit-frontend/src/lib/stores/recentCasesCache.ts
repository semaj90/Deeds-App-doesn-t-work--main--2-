// Recent Cases Cache for Quick Access and Auto-completion
import { writable, derived, type Readable } from 'svelte/store';
import { browser } from '$app/environment';

export interface CacheEntry {
  id: string;
  title: string;
  description: string;
  lastAccessed: Date;
  accessCount: number;
  status: string;
  snippets: string[];
  tags: string[];
}

export interface RecentCasesCache {
  entries: CacheEntry[];
  maxEntries: number;
  lastUpdated: Date;
}

const CACHE_KEY = 'wardenet_recent_cases';
const MAX_CACHE_ENTRIES = 50;

// Initialize cache from localStorage if in browser
function initializeCache(): RecentCasesCache {
  if (!browser) {
    return {
      entries: [],
      maxEntries: MAX_CACHE_ENTRIES,
      lastUpdated: new Date()
    };
  }

  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        lastUpdated: new Date(parsed.lastUpdated),
        entries: parsed.entries.map((entry: any) => ({
          ...entry,
          lastAccessed: new Date(entry.lastAccessed)
        }))
      };
    }
  } catch (error) {
    console.warn('Failed to load recent cases cache:', error);
  }

  return {
    entries: [],
    maxEntries: MAX_CACHE_ENTRIES,
    lastUpdated: new Date()
  };
}

// Create the store
export const recentCasesCache = writable<RecentCasesCache>(initializeCache());

// Auto-save to localStorage when cache changes
if (browser) {
  recentCasesCache.subscribe((cache) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('Failed to save recent cases cache:', error);
    }
  });
}

// Derived stores for quick access
export const recentCases = derived(
  recentCasesCache,
  ($cache) => $cache.entries.sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime())
);

export const frequentCases = derived(
  recentCasesCache,
  ($cache) => $cache.entries.sort((a, b) => b.accessCount - a.accessCount).slice(0, 10)
);

export const recentSnippets = derived(
  recentCasesCache,
  ($cache) => {
    const allSnippets: string[] = [];
    $cache.entries.forEach(entry => {
      allSnippets.push(...entry.snippets);
    });
    return [...new Set(allSnippets)].slice(0, 100); // Unique snippets, max 100
  }
);

// Cache management functions
export class RecentCacheManager {
  
  addCaseToCache(caseData: {
    id: string;
    title: string;
    description: string;
    status: string;
    tags?: string[];
  }) {
    recentCasesCache.update(cache => {
      const existingIndex = cache.entries.findIndex(entry => entry.id === caseData.id);
      
      const snippets = this.extractSnippets(caseData.description);
      
      if (existingIndex !== -1) {
        // Update existing entry
        cache.entries[existingIndex] = {
          ...cache.entries[existingIndex],
          lastAccessed: new Date(),
          accessCount: cache.entries[existingIndex].accessCount + 1,
          title: caseData.title,
          description: caseData.description,
          status: caseData.status,
          snippets: [...new Set([...cache.entries[existingIndex].snippets, ...snippets])],
          tags: [...new Set([...(cache.entries[existingIndex].tags || []), ...(caseData.tags || [])])]
        };
      } else {
        // Add new entry
        const newEntry: CacheEntry = {
          id: caseData.id,
          title: caseData.title,
          description: caseData.description,
          lastAccessed: new Date(),
          accessCount: 1,
          status: caseData.status,
          snippets,
          tags: caseData.tags || []
        };
        
        cache.entries.unshift(newEntry);
      }
      
      // Trim cache if it exceeds max entries
      if (cache.entries.length > cache.maxEntries) {
        cache.entries = cache.entries.slice(0, cache.maxEntries);
      }
      
      cache.lastUpdated = new Date();
      return cache;
    });
  }

  addTextSnippet(caseId: string, snippet: string) {
    if (!snippet.trim() || snippet.length < 10) return;
    
    recentCasesCache.update(cache => {
      const entryIndex = cache.entries.findIndex(entry => entry.id === caseId);
      if (entryIndex !== -1) {
        const cleanSnippet = snippet.trim();
        if (!cache.entries[entryIndex].snippets.includes(cleanSnippet)) {
          cache.entries[entryIndex].snippets.push(cleanSnippet);
          // Keep only the most recent 20 snippets per case
          if (cache.entries[entryIndex].snippets.length > 20) {
            cache.entries[entryIndex].snippets = cache.entries[entryIndex].snippets.slice(-20);
          }
        }
      }
      return cache;
    });
  }

  searchCache(query: string): CacheEntry[] {
    let results: CacheEntry[] = [];
    
    recentCasesCache.subscribe(cache => {
      const searchLower = query.toLowerCase();
      results = cache.entries.filter(entry => 
        entry.title.toLowerCase().includes(searchLower) ||
        entry.description.toLowerCase().includes(searchLower) ||
        entry.snippets.some(snippet => snippet.toLowerCase().includes(searchLower)) ||
        entry.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    })();
    
    return results.slice(0, 10); // Return top 10 matches
  }

  getSuggestionsForPartialText(partialText: string): string[] {
    if (partialText.length < 3) return [];
    
    let suggestions: string[] = [];
    
    recentCasesCache.subscribe(cache => {
      const searchLower = partialText.toLowerCase();
      const allSnippets: string[] = [];
      
      cache.entries.forEach(entry => {
        allSnippets.push(...entry.snippets);
      });
      
      suggestions = allSnippets
        .filter(snippet => snippet.toLowerCase().includes(searchLower))
        .slice(0, 5); // Top 5 suggestions
    })();
    
    return suggestions;
  }

  getRelatedCases(caseId: string): CacheEntry[] {
    let results: CacheEntry[] = [];
    
    recentCasesCache.subscribe(cache => {
      const currentCase = cache.entries.find(entry => entry.id === caseId);
      if (!currentCase) return [];
      
      // Find cases with similar tags or overlapping text
      results = cache.entries
        .filter(entry => entry.id !== caseId)
        .map(entry => ({
          entry,
          similarity: this.calculateSimilarity(currentCase, entry)
        }))
        .filter(item => item.similarity > 0.2) // Minimum similarity threshold
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5)
        .map(item => item.entry);
    })();
    
    return results;
  }

  private calculateSimilarity(case1: CacheEntry, case2: CacheEntry): number {
    let score = 0;
    
    // Tag similarity
    const commonTags = case1.tags.filter(tag => case2.tags.includes(tag));
    score += commonTags.length * 0.3;
    
    // Text similarity (simple keyword matching)
    const words1 = this.extractKeywords(case1.description);
    const words2 = this.extractKeywords(case2.description);
    const commonWords = words1.filter(word => words2.includes(word));
    score += commonWords.length * 0.1;
    
    // Status similarity
    if (case1.status === case2.status) {
      score += 0.2;
    }
    
    return Math.min(score, 1.0); // Cap at 1.0
  }

  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 20); // Top 20 keywords
  }

  private extractSnippets(description: string): string[] {
    // Extract meaningful sentences from description
    const sentences = description
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20 && s.length < 200);
    
    return sentences.slice(0, 5); // Max 5 snippets per case
  }

  clearCache() {
    recentCasesCache.set({
      entries: [],
      maxEntries: MAX_CACHE_ENTRIES,
      lastUpdated: new Date()
    });
  }

  exportCache(): string {
    let cacheData: RecentCasesCache;
    recentCasesCache.subscribe(cache => cacheData = cache)();
    return JSON.stringify(cacheData!, null, 2);
  }

  importCache(jsonData: string): boolean {
    try {
      const imported = JSON.parse(jsonData);
      recentCasesCache.set({
        ...imported,
        lastUpdated: new Date(imported.lastUpdated),
        entries: imported.entries.map((entry: any) => ({
          ...entry,
          lastAccessed: new Date(entry.lastAccessed)
        }))
      });
      return true;
    } catch (error) {
      console.error('Failed to import cache:', error);
      return false;
    }
  }
}

// Global instance
export const recentCacheManager = new RecentCacheManager();

// Auto-complete helpers
export function getAutoCompleteOptions(partialText: string): string[] {
  if (partialText.length < 2) return [];
  
  let options: string[] = [];
  
  recentCasesCache.subscribe(cache => {
    const searchTerm = partialText.toLowerCase();
    
    // Get matching snippets
    const snippets = cache.entries
      .flatMap(entry => entry.snippets)
      .filter(snippet => snippet.toLowerCase().includes(searchTerm))
      .slice(0, 5);
    
    // Get matching case titles
    const titles = cache.entries
      .filter(entry => entry.title.toLowerCase().includes(searchTerm))
      .map(entry => entry.title)
      .slice(0, 3);
    
    options = [...new Set([...snippets, ...titles])];
  })();
  
  return options;
}
