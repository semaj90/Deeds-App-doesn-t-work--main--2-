/**
 * Advanced Search & Filtering System (Simplified)
 * Supports full-text search, filters, and suggestions
 */

import { db } from '../db';
import { cases, evidence } from '../db/schema';
import { and, or, like, gte, lte, eq, desc, asc, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export interface SearchFilters {
  query?: string;
  caseStatus?: string[];
  priority?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
  evidenceType?: string[];
  sortBy?: 'date' | 'priority' | 'status' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  type: 'case' | 'evidence';
  id: string;
  title: string;
  description?: string;
  relevanceScore?: number;
  metadata: Record<string, any>;
  highlights?: string[];
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  facets: {
    caseStatus: { value: string; count: number }[];
    priority: { value: string; count: number }[];
    evidenceType: { value: string; count: number }[];
    tags: { value: string; count: number }[];
  };
  suggestions?: string[];
  queryTime: number;
}

class AdvancedSearch {
  /**
   * Perform comprehensive search across cases and evidence
   */
  async search(filters: SearchFilters): Promise<SearchResponse> {
    const startTime = Date.now();
    
    try {
      // Parallel search across different entity types
      const [caseResults, evidenceResults] = await Promise.all([
        this.searchCases(filters),
        this.searchEvidence(filters)
      ]);

      // Combine and rank results
      const allResults = [
        ...caseResults.map(r => ({ ...r, type: 'case' as const })),
        ...evidenceResults.map(r => ({ ...r, type: 'evidence' as const }))
      ];

      // Sort by relevance or specified criteria
      const sortedResults = this.sortResults(allResults, filters);

      // Apply pagination
      const paginatedResults = this.paginate(sortedResults, filters);

      // Generate facets for filtering UI
      const facets = await this.generateFacets(filters);

      // Generate search suggestions
      const suggestions = await this.generateSuggestions(filters.query || '');

      return {
        results: paginatedResults,
        total: allResults.length,
        facets,
        suggestions,
        queryTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  /**
   * Search cases with advanced filters
   */
  private async searchCases(filters: SearchFilters): Promise<SearchResult[]> {
    const conditions: SQL[] = [];

    // Text search
    if (filters.query) {
      conditions.push(
        or(
          like(cases.title, `%${filters.query}%`),
          like(cases.description, `%${filters.query}%`)
        )!
      );
    }

    // Status filter
    if (filters.caseStatus?.length) {
      conditions.push(sql`${cases.status} = ANY(${filters.caseStatus})`);
    }

    // Priority filter
    if (filters.priority?.length) {
      conditions.push(sql`${cases.priority} = ANY(${filters.priority})`);
    }

    // Date range filter
    if (filters.dateRange) {
      conditions.push(
        and(
          gte(cases.createdAt, new Date(filters.dateRange.start)),
          lte(cases.createdAt, new Date(filters.dateRange.end))
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        id: cases.id,
        title: cases.title,
        description: cases.description,
        status: cases.status,
        priority: cases.priority,
        createdAt: cases.createdAt,
        tags: cases.tags
      })
      .from(cases)
      .where(whereClause)
      .limit(1000);

    return results.map(case_ => ({
      type: 'case' as const,
      id: case_.id,
      title: case_.title,
      description: case_.description || undefined,
      relevanceScore: this.calculateRelevance((case_.title || '') + ' ' + (case_.description || ''), filters.query),
      metadata: {
        status: case_.status,
        priority: case_.priority,
        createdAt: case_.createdAt,
        tags: case_.tags
      },
      highlights: this.generateHighlights((case_.title || '') + ' ' + (case_.description || ''), filters.query)
    }));
  }

  /**
   * Search evidence with filters
   */
  private async searchEvidence(filters: SearchFilters): Promise<SearchResult[]> {
    const conditions: SQL[] = [];

    if (filters.query) {
      conditions.push(
        or(
          like(evidence.fileName, `%${filters.query}%`),
          like(evidence.description, `%${filters.query}%`)
        )!
      );
    }

    if (filters.evidenceType?.length) {
      conditions.push(sql`${evidence.fileType} = ANY(${filters.evidenceType})`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        id: evidence.id,
        fileName: evidence.fileName,
        description: evidence.description,
        fileType: evidence.fileType,
        uploadedAt: evidence.uploadedAt,
        caseId: evidence.caseId
      })
      .from(evidence)
      .where(whereClause)
      .limit(500);

    return results.map(evid => ({
      type: 'evidence' as const,
      id: evid.id,
      title: evid.fileName || 'Untitled Evidence',
      description: evid.description || undefined,
      relevanceScore: this.calculateRelevance((evid.fileName || '') + ' ' + (evid.description || ''), filters.query),
      metadata: {
        fileType: evid.fileType,
        uploadedAt: evid.uploadedAt,
        caseId: evid.caseId
      },
      highlights: this.generateHighlights((evid.fileName || '') + ' ' + (evid.description || ''), filters.query)
    }));
  }

  /**
   * Generate faceted search filters
   */
  private async generateFacets(filters: SearchFilters) {
    // In a real implementation, these would be computed from actual data
    return {
      caseStatus: [
        { value: 'open', count: 45 },
        { value: 'in_progress', count: 32 },
        { value: 'pending', count: 18 },
        { value: 'closed', count: 89 }
      ],
      priority: [
        { value: 'high', count: 23 },
        { value: 'medium', count: 67 },
        { value: 'low', count: 34 }
      ],
      evidenceType: [
        { value: 'document', count: 156 },
        { value: 'image', count: 89 },
        { value: 'video', count: 34 },
        { value: 'audio', count: 12 }
      ],
      tags: [
        { value: 'urgent', count: 23 },
        { value: 'fraud', count: 45 },
        { value: 'assault', count: 34 },
        { value: 'theft', count: 67 }
      ]
    };
  }

  /**
   * Generate search suggestions based on query
   */
  private async generateSuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 2) return [];

    const commonTerms = [
      'fraud investigation',
      'assault case',
      'theft report',
      'evidence analysis',
      'witness statement',
      'forensic report',
      'crime scene',
      'suspect profile'
    ];

    return commonTerms
      .filter(term => term.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);
  }

  /**
   * Calculate relevance score for search results
   */
  private calculateRelevance(text: string, query?: string): number {
    if (!query) return 0.5;
    
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    
    let score = 0;
    
    if (textLower.includes(queryLower)) {
      score += 0.8;
    }
    
    const queryWords = queryLower.split(' ');
    const textWords = textLower.split(' ');
    const matchingWords = queryWords.filter(word => 
      textWords.some(textWord => textWord.includes(word))
    );
    
    score += (matchingWords.length / queryWords.length) * 0.5;
    
    const firstMatch = textLower.indexOf(queryLower);
    if (firstMatch !== -1) {
      score += Math.max(0, (text.length - firstMatch) / text.length) * 0.2;
    }
    
    return Math.min(1, score);
  }

  /**
   * Generate highlighted text snippets
   */
  private generateHighlights(text: string, query?: string): string[] {
    if (!query) return [];
    
    const highlights: string[] = [];
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    
    let index = textLower.indexOf(queryLower);
    while (index !== -1 && highlights.length < 3) {
      const start = Math.max(0, index - 50);
      const end = Math.min(text.length, index + queryLower.length + 50);
      const snippet = text.slice(start, end);
      highlights.push(snippet);
      index = textLower.indexOf(queryLower, index + 1);
    }
    
    return highlights;
  }

  /**
   * Sort search results
   */
  private sortResults(results: SearchResult[], filters: SearchFilters): SearchResult[] {
    const { sortBy = 'relevance', sortOrder = 'desc' } = filters;
    
    return results.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'relevance':
          comparison = (a.relevanceScore || 0) - (b.relevanceScore || 0);
          break;
        case 'date':
          const aDate = new Date(a.metadata.createdAt || a.metadata.uploadedAt || 0);
          const bDate = new Date(b.metadata.createdAt || b.metadata.uploadedAt || 0);
          comparison = aDate.getTime() - bDate.getTime();
          break;
        case 'priority':
          const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
          comparison = (priorityOrder[a.metadata.priority as string] || 0) - (priorityOrder[b.metadata.priority as string] || 0);
          break;
        default:
          comparison = a.title.localeCompare(b.title);
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * Apply pagination to results
   */
  private paginate(results: SearchResult[], filters: SearchFilters): SearchResult[] {
    const { limit = 20, offset = 0 } = filters;
    return results.slice(offset, offset + limit);
  }
}

// Export singleton instance
export const advancedSearch = new AdvancedSearch();
