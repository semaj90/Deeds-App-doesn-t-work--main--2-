// WardenNet In-Memory Cache for SvelteKit API Routes
// Provides fast, real-time caching for database queries

interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number; // time to live in milliseconds
  tags: string[];
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
}

class WardenNetCache {
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats;
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private maxSize = 1000; // max number of cache entries
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Get cached data by key
   */
  get<T = any>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data as T;
  }

  /**
   * Set cache data with optional TTL and tags
   */
  set<T = any>(key: string, data: T, ttl: number = this.defaultTTL, tags: string[] = []): void {
    // Check cache size limit
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      ttl,
      tags
    };

    this.cache.set(key, entry);
    this.stats.sets++;
  }

  /**
   * Delete cache entry by key
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }

  /**
   * Clear cache entries by tag(s)
   */
  clearByTags(tags: string[]): number {
    let count = 0;
    for (const [key, entry] of this.cache) {
      if (tags.some(tag => entry.tags.includes(tag))) {
        this.cache.delete(key);
        count++;
      }
    }
    this.stats.deletes += count;
    return count;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const count = this.cache.size;
    this.cache.clear();
    this.stats.deletes += count;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { size: number; hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0
    };
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldest(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);
    
    const toEvict = Math.floor(this.maxSize * 0.1);
    for (let i = 0; i < toEvict && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
      this.stats.evictions++;
    }
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        this.stats.evictions++;
      }
    }
  }

  /**
   * Destroy cache and cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

// Singleton cache instance
export const cache = new WardenNetCache();

// Cache key helpers for consistent naming
export const cacheKeys = {
  cases: {
    all: 'cases:all',
    byId: (id: string) => `cases:${id}`,
    byUser: (userId: string) => `cases:user:${userId}`,
    byStatus: (status: string) => `cases:status:${status}`,
    search: (query: string) => `cases:search:${query.slice(0, 50)}`
  },  evidence: {
    all: 'evidence:all',
    byId: (id: string) => `evidence:${id}`,
    byCase: (caseId: string) => `evidence:case:${caseId}`,
    byUser: (userId: string) => `evidence:user:${userId}`,
    search: (query: string) => `evidence:search:${query.slice(0, 50)}`
  },
  criminals: {
    all: 'criminals:all',
    byId: (id: string) => `criminals:${id}`,
    search: (query: string) => `criminals:search:${query.slice(0, 50)}`
  },
  statutes: {
    all: 'statutes:all',
    byId: (id: string) => `statutes:${id}`,
    search: (query: string) => `statutes:search:${query.slice(0, 50)}`
  },
  users: {
    all: 'users:all',
    byId: (id: string) => `users:${id}`,
    byEmail: (email: string) => `users:email:${email}`
  }
};

// Cache tags for invalidation
export const cacheTags = {
  cases: 'cases',
  evidence: 'evidence',
  criminals: 'criminals',
  statutes: 'statutes',
  users: 'users',
  auth: 'auth'
};

// Helper to generate cache key with params
export function generateCacheKey(base: string, params: Record<string, any> = {}): string {
  const paramString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join('|');
  
  return paramString ? `${base}:${paramString}` : base;
}

// Cache middleware for API routes
export function withCache<T = any>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000, // 5 minutes
  tags: string[] = []
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return Promise.resolve(cached);
  }

  return fetcher().then((data) => {
    cache.set(key, data, ttl, tags);
    return data;
  });
}

// Invalidation helpers
export function invalidateCache(patterns: string[] | string): void {
  const patternsArray = Array.isArray(patterns) ? patterns : [patterns];
  
  for (const pattern of patternsArray) {
    if (pattern.includes('*')) {
      // Handle wildcard patterns by checking all keys
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      for (const key of cache['cache'].keys()) {
        if (regex.test(key)) {
          cache.delete(key);
        }
      }
    } else {
      cache.delete(pattern);
    }
  }
}

export function invalidateCacheByTags(tags: string[]): void {
  cache.clearByTags(tags);
}
