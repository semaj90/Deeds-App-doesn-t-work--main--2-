// Enhanced RAG Service for Personalized Legal Case Management
// This service handles personalized retrieval-augmented generation by combining:
// 1. User's saved LLM outputs and insights
// 2. Global legal resources (cases, statutes, evidence)
// 3. User preferences and search history
// 4. Vector similarity and text-based matching

import { db } from '$lib/server/db';
import { 
  savedItems, 
  savedItemSourceChunks, 
  cases, 
  evidence, 
  statutes, 
  userSearchPreferences,
  knowledgeBase
} from '$lib/server/db/schema-new';
import { eq, and, desc, asc, sql, inArray, or, like, ilike } from 'drizzle-orm';

// Types
export interface EnhancedSource {
  type: string;
  id: string;
  title: string;
  relevance: number;
  content: string;
  sourceType: 'personal' | 'global' | 'knowledge_base';
  metadata?: {
    userRating?: number;
    usageCount?: number;
    lastUsed?: Date;
    tags?: string[];
    originalQuery?: string;
    caseId?: string;
    dateCreated?: Date;
  };
}

export interface RetrievalContext {
  query: string;
  userId?: string;
  caseId?: string;
  sessionHistory?: string[];
  contextData?: any;
}

export interface RetrievalResults {
  personalSources: EnhancedSource[];
  globalSources: EnhancedSource[];
  knowledgeBaseSources: EnhancedSource[];
  combinedSources: EnhancedSource[];
  userPreferences?: any;
  retrievalMetadata: {
    totalSources: number;
    personalSourcesCount: number;
    globalSourcesCount: number;
    knowledgeBaseSourcesCount: number;
    queryProcessingTime: number;
    userPreferencesApplied: boolean;
  };
}

export class EnhancedRAGService {
  
  /**
   * Main retrieval method that orchestrates personalized and global search
   */
  async retrieveRelevantSources(context: RetrievalContext): Promise<RetrievalResults> {
    const startTime = Date.now();
    
    console.log('Enhanced RAG retrieval started:', {
      query: context.query.substring(0, 100) + '...',
      userId: context.userId || 'anonymous',
      caseId: context.caseId
    });

    try {
      // Step 1: Parallel retrieval from different sources
      const retrievalTasks = [
        this.retrieveGlobalSources(context),
        this.retrieveKnowledgeBaseSources(context)
      ];

      // Add personal retrieval if user is authenticated
      if (context.userId) {
        retrievalTasks.unshift(this.retrievePersonalSources(context));
        retrievalTasks.push(this.getUserSearchPreferences(context.userId));
      }

      const results = await Promise.allSettled(retrievalTasks);
      
      // Extract results with proper type checking
      let personalSources: EnhancedSource[] = [];
      let globalSources: EnhancedSource[] = [];
      let knowledgeBaseSources: EnhancedSource[] = [];
      let userPreferences: any = null;

      if (context.userId) {
        personalSources = results[0].status === 'fulfilled' ? (results[0] as PromiseFulfilledResult<EnhancedSource[]>).value : [];
        globalSources = results[1].status === 'fulfilled' ? (results[1] as PromiseFulfilledResult<EnhancedSource[]>).value : [];
        knowledgeBaseSources = results[2].status === 'fulfilled' ? (results[2] as PromiseFulfilledResult<EnhancedSource[]>).value : [];
        userPreferences = results[3] && results[3].status === 'fulfilled' ? (results[3] as PromiseFulfilledResult<any>).value : null;
      } else {
        globalSources = results[0].status === 'fulfilled' ? (results[0] as PromiseFulfilledResult<EnhancedSource[]>).value : [];
        knowledgeBaseSources = results[1].status === 'fulfilled' ? (results[1] as PromiseFulfilledResult<EnhancedSource[]>).value : [];
      }

      // Step 2: Combine and re-rank all sources
      const combinedSources = this.combineAndRerankSources(
        personalSources, 
        globalSources, 
        knowledgeBaseSources,
        context, 
        userPreferences
      );

      // Step 3: Update usage tracking for personal sources
      if (context.userId && personalSources.length > 0) {
        await this.updatePersonalSourceUsage(personalSources.map(s => s.id));
      }

      const processingTime = Date.now() - startTime;

      const retrievalResults: RetrievalResults = {
        personalSources,
        globalSources,
        knowledgeBaseSources,
        combinedSources,
        userPreferences,
        retrievalMetadata: {
          totalSources: combinedSources.length,
          personalSourcesCount: personalSources.length,
          globalSourcesCount: globalSources.length,
          knowledgeBaseSourcesCount: knowledgeBaseSources.length,
          queryProcessingTime: processingTime,
          userPreferencesApplied: !!userPreferences
        }
      };

      console.log('Enhanced RAG retrieval completed:', retrievalResults.retrievalMetadata);
      return retrievalResults;

    } catch (error) {
      console.error('Enhanced RAG retrieval error:', error);
      
      // Return empty results with error metadata
      return {
        personalSources: [],
        globalSources: [],
        knowledgeBaseSources: [],
        combinedSources: [],
        retrievalMetadata: {
          totalSources: 0,
          personalSourcesCount: 0,
          globalSourcesCount: 0,
          knowledgeBaseSourcesCount: 0,
          queryProcessingTime: Date.now() - startTime,
          userPreferencesApplied: false
        }
      };
    }
  }

  /**
   * Retrieve user's saved items and personal insights
   */
  private async retrievePersonalSources(context: RetrievalContext): Promise<EnhancedSource[]> {
    if (!context.userId) return [];
    try {
      console.log('Retrieving personal sources for user:', context.userId);

      // Get user's saved items with relevance filtering
      const savedItemsData = await db
        .select({
          id: savedItems.id,
          title: savedItems.title,
          content: savedItems.content,
          contentType: savedItems.contentType,
          originalQuery: savedItems.originalQuery,
          tags: savedItems.tags,
          userRating: savedItems.userRating,
          userNotes: savedItems.userNotes,
          usage_count: savedItems.usage_count,
          lastUsedAt: savedItems.lastUsedAt,
          createdAt: savedItems.createdAt
        })
        .from(savedItems)
        .where(eq(savedItems.userId, context.userId))
        .orderBy(desc(savedItems.lastUsedAt), desc(savedItems.userRating), desc(savedItems.usage_count))
        .limit(20);
      const items = this.isValidArray(savedItemsData) ? savedItemsData : [];
      const scoredSources = items
        .map(item => {
          const searchText = `${item.title || ''} ${item.content || ''} ${item.originalQuery || ''} ${this.isValidArray(item.tags) ? (item.tags as string[]).join(' ') : ''}`;
          const relevance = this.calculateAdvancedTextSimilarity(context.query, searchText);
          let boostedRelevance = relevance;
          if (item.userRating && item.userRating > 3) {
            boostedRelevance *= (1 + (item.userRating - 3) * 0.2);
          }
          if (item.usage_count && item.usage_count > 2) {
            boostedRelevance *= (1 + Math.log(item.usage_count) * 0.1);
          }
          return {
            type: 'saved_item',
            id: item.id,
            title: item.title || '',
            relevance: Math.min(boostedRelevance * 1.3, 1.0),
            content: item.content || '',
            sourceType: 'personal' as const,
            metadata: {
              userRating: item.userRating || undefined,
              usageCount: item.usage_count || 0,
              lastUsed: this.safeDate(item.lastUsedAt),
              tags: this.isValidArray(item.tags) ? item.tags as string[] : [],
              originalQuery: item.originalQuery || undefined,
              dateCreated: this.safeDate(item.createdAt)
            }
          };
        })
        .filter(source => source.relevance > 0.15)
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 6);
      return scoredSources;
    } catch (error) {
      console.error('Error retrieving personal sources:', error);
      return [];
    }
  }

  /**
   * Retrieve global legal resources (cases, evidence, statutes)
   */
  private async retrieveGlobalSources(context: RetrievalContext): Promise<EnhancedSource[]> {
    try {
      console.log('Retrieving global legal sources');
      
      const globalSources: EnhancedSource[] = [];
      
      // Retrieve cases (prioritize current case if specified)
      const casesTask = this.retrieveCaseSources(context);
      
      // Retrieve evidence and statutes in parallel
      const [caseResults, evidenceResults, statuteResults] = await Promise.allSettled([
        casesTask,
        this.retrieveEvidenceSources(context),
        this.retrieveStatuteSources(context)
      ]);

      // Combine results
      if (caseResults.status === 'fulfilled') {
        globalSources.push(...(caseResults as PromiseFulfilledResult<EnhancedSource[]>).value);
      }
      if (evidenceResults.status === 'fulfilled') {
        globalSources.push(...(evidenceResults as PromiseFulfilledResult<EnhancedSource[]>).value);
      }
      if (statuteResults.status === 'fulfilled') {
        globalSources.push(...(statuteResults as PromiseFulfilledResult<EnhancedSource[]>).value);
      }

      // Sort by relevance and return top sources
      const sortedSources = globalSources
        .filter(source => source.relevance > 0.1)
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 6);

      console.log(`Found ${sortedSources.length} relevant global sources`);
      return sortedSources;

    } catch (error) {
      console.error('Error retrieving global sources:', error);
      return [];
    }
  }

  private async retrieveCaseSources(context: RetrievalContext): Promise<EnhancedSource[]> {
    const sources: EnhancedSource[] = [];
    try {
      if (context.caseId) {
        const currentCase = await db
          .select()
          .from(cases)
          .where(eq(cases.id, context.caseId))
          .limit(1);
        if (this.isValidArray(currentCase) && currentCase.length > 0) {
          const case_ = currentCase[0];
          sources.push({
            type: 'case',
            id: case_.id,
            title: case_.title || '',
            relevance: 0.95, // High relevance for current case
            content: case_.description || '',
            sourceType: 'global',
            metadata: {
              caseId: case_.id,
              tags: this.isValidArray(case_.aiTags) ? case_.aiTags as string[] : [],
              dateCreated: this.safeDate(case_.createdAt)
            }
          });
        }
      }
      const relatedCases = await db
        .select()
        .from(cases)
        .where(
          and(
            context.caseId ? sql`${cases.id} != ${context.caseId}` : undefined,
            or(
              ilike(cases.title, `%${context.query}%`),
              ilike(cases.description, `%${context.query}%`)
            )
          )
        )
        .limit(5);
      (this.isValidArray(relatedCases) ? relatedCases : []).forEach(case_ => {
        const searchText = `${case_.title || ''} ${case_.description || ''}`;
        const relevance = this.calculateAdvancedTextSimilarity(context.query, searchText);
        if (relevance > 0.2) {
          sources.push({
            type: 'case',
            id: case_.id,
            title: case_.title || '',
            relevance: relevance * 0.8, // Slightly lower than personal sources
            content: case_.description || '',
            sourceType: 'global',
            metadata: {
              caseId: case_.id,
              tags: this.isValidArray(case_.aiTags) ? case_.aiTags as string[] : [],
              dateCreated: this.safeDate(case_.createdAt)
            }
          });
        }
      });
    } catch (error) {
      console.error('Error retrieving case sources:', error);
    }
    return sources;
  }

  private async retrieveEvidenceSources(context: RetrievalContext): Promise<EnhancedSource[]> {
    const sources: EnhancedSource[] = [];
    try {
      const evidenceData = await db
        .select()
        .from(evidence)
        .where(
          or(
            ilike(evidence.title, `%${context.query}%`),
            ilike(evidence.description, `%${context.query}%`)
          )
        )
        .limit(8);
      (this.isValidArray(evidenceData) ? evidenceData : []).forEach(item => {
        const searchText = `${item.title || ''} ${item.description || ''}`;
        const relevance = this.calculateAdvancedTextSimilarity(context.query, searchText);
        if (relevance > 0.15) {
          sources.push({
            type: 'evidence',
            id: item.id,
            title: item.title || '',
            relevance: relevance * 0.75,
            content: item.description || '',
            sourceType: 'global',
            metadata: {
              caseId: item.caseId || undefined,
              dateCreated: this.safeDate(item.createdAt)
            }
          });
        }
      });
    } catch (error) {
      console.error('Error retrieving evidence sources:', error);
    }
    return sources;
  }

  private async retrieveStatuteSources(context: RetrievalContext): Promise<EnhancedSource[]> {
    const sources: EnhancedSource[] = [];
    try {
      const statuteData = await db
        .select()
        .from(statutes)
        .where(
          or(
            ilike(statutes.title, `%${context.query}%`),
            ilike(statutes.content, `%${context.query}%`)
          )
        )
        .limit(6);
      (this.isValidArray(statuteData) ? statuteData : []).forEach(item => {
        const searchText = `${item.title || ''} ${item.content || ''}`;
        const relevance = this.calculateAdvancedTextSimilarity(context.query, searchText);
        if (relevance > 0.15) {
          sources.push({
            type: 'statute',
            id: item.id,
            title: item.title || '',
            relevance: relevance * 0.8,
            content: item.content || '',
            sourceType: 'global',
            metadata: {
              dateCreated: this.safeDate(item.createdAt)
            }
          });
        }
      });
    } catch (error) {
      console.error('Error retrieving statute sources:', error);
    }
    return sources;
  }

  /**
   * Retrieve from global knowledge base
   */
  private async retrieveKnowledgeBaseSources(context: RetrievalContext): Promise<EnhancedSource[]> {
    try {
      const kbData = await db
        .select()
        .from(knowledgeBase)
        .where(
          and(
            eq(knowledgeBase.isPublic, true),
            or(
              ilike(knowledgeBase.title, `%${context.query}%`),
              ilike(knowledgeBase.content, `%${context.query}%`)
            )
          )
        )
        .orderBy(desc(knowledgeBase.confidenceScore))
        .limit(5);
      const sources = (this.isValidArray(kbData) ? kbData : [])
        .map(item => {
          const searchText = `${item.title || ''} ${item.content || ''}`;
          const relevance = this.calculateAdvancedTextSimilarity(context.query, searchText);
          return {
            type: 'knowledge_base',
            id: item.id,
            title: item.title || '',
            relevance: relevance * 0.9, // High confidence for verified knowledge
            content: item.content,
            sourceType: 'knowledge_base' as const,
            metadata: {
              tags: this.isValidArray(item.tags) ? item.tags as string[] : [],
              dateCreated: this.safeDate(item.createdAt)
            }
          };
        })
        .filter(source => source.relevance > 0.15)
        .sort((a, b) => b.relevance - a.relevance);
      return sources;
    } catch (error) {
      console.error('Error retrieving knowledge base sources:', error);
      return [];
    }
  }

  /**
   * Get user search preferences
   */
  private async getUserSearchPreferences(userId: string): Promise<any> {
    try {
      const preferences = await db
        .select()
        .from(userSearchPreferences)
        .where(eq(userSearchPreferences.userId, userId))
        .limit(1);
      
      return preferences.length > 0 ? preferences[0] : null;
    } catch (error) {
      console.error('Error retrieving user search preferences:', error);
      return null;
    }
  }

  /**
   * Combine and re-rank all sources using advanced algorithms
   */
  private combineAndRerankSources(
    personalSources: EnhancedSource[],
    globalSources: EnhancedSource[],
    knowledgeBaseSources: EnhancedSource[],
    context: RetrievalContext,
    userPreferences?: any
  ): EnhancedSource[] {
    
    const allSources = [...personalSources, ...globalSources, ...knowledgeBaseSources];
    
    // Apply user preferences if available
    if (userPreferences) {
      this.applyUserPreferences(allSources, userPreferences);
    }
    
    // Apply context-based boosting
    this.applyContextualBoosting(allSources, context);
    
    // Remove duplicates and sort by final relevance
    const uniqueSources = this.removeDuplicateSources(allSources);
    
    return uniqueSources
      .filter(source => source.relevance > 0.05)
      .sort((a, b) => {
        // Prioritize personal sources with similar relevance
        if (Math.abs(a.relevance - b.relevance) < 0.1) {
          if (a.sourceType === 'personal' && b.sourceType !== 'personal') return -1;
          if (a.sourceType !== 'personal' && b.sourceType === 'personal') return 1;
        }
        return b.relevance - a.relevance;
      })
      .slice(0, 10); // Return top 10 sources
  }

  private applyUserPreferences(sources: EnhancedSource[], userPreferences: any): void {
    const preferredSources = userPreferences.preferredSources || [];
    const excludedSources = userPreferences.excludedSources || [];
    
    sources.forEach(source => {
      // Boost preferred source types
      if (preferredSources.includes(source.type)) {
        source.relevance = Math.min(source.relevance * 1.4, 1.0);
      }
      
      // Penalize excluded source types
      if (excludedSources.includes(source.type)) {
        source.relevance *= 0.4;
      }
    });
  }

  private applyContextualBoosting(sources: EnhancedSource[], context: RetrievalContext): void {
    sources.forEach(source => {
      // Boost sources related to current case
      if (context.caseId && source.metadata?.caseId === context.caseId) {
        source.relevance = Math.min(source.relevance * 1.2, 1.0);
      }
      
      // Boost recently used personal sources
      if (source.sourceType === 'personal' && source.metadata?.lastUsed) {
        const daysSinceUsed = (Date.now() - source.metadata.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUsed < 7) {
          source.relevance = Math.min(source.relevance * (1 + (7 - daysSinceUsed) * 0.05), 1.0);
        }
      }
    });
  }

  private removeDuplicateSources(sources: EnhancedSource[]): EnhancedSource[] {
    const seen = new Set<string>();
    const unique: EnhancedSource[] = [];
    
    sources.forEach(source => {
      const key = `${source.type}-${source.title.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(source);
      } else {
        // If duplicate, keep the one with higher relevance
        const existingIndex = unique.findIndex(s => `${s.type}-${s.title.toLowerCase()}` === key);
        if (existingIndex >= 0 && source.relevance > unique[existingIndex].relevance) {
          unique[existingIndex] = source;
        }
      }
    });
    
    return unique;
  }

  /**
   * Advanced text similarity calculation with multiple algorithms
   */
  private calculateAdvancedTextSimilarity(query: string, text: string): number {
    const queryWords = this.preprocessText(query);
    const textWords = this.preprocessText(text);
    
    if (queryWords.length === 0 || textWords.length === 0) return 0;
    
    // 1. Exact phrase matching (highest weight)
    const phraseScore = this.calculatePhraseMatching(query.toLowerCase(), text.toLowerCase());
    
    // 2. Keyword overlap with TF-IDF-like scoring
    const keywordScore = this.calculateKeywordOverlap(queryWords, textWords);
    
    // 3. Semantic proximity (basic implementation)
    const proximityScore = this.calculateWordProximity(queryWords, textWords);
    
    // Combine scores with weights
    const finalScore = (phraseScore * 0.5) + (keywordScore * 0.3) + (proximityScore * 0.2);
    
    return Math.min(finalScore, 1.0);
  }

  private preprocessText(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.isStopWord(word));
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'this', 'that', 'these', 'those', 'was', 'were', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must']);
    return stopWords.has(word);
  }

  private calculatePhraseMatching(query: string, text: string): number {
    if (text.includes(query)) return 1.0;
    
    // Check for partial phrase matches
    const queryPhrases = query.split(' ').filter(word => word.length > 2);
    let matches = 0;
    
    queryPhrases.forEach(phrase => {
      if (text.includes(phrase)) matches++;
    });
    
    return queryPhrases.length > 0 ? matches / queryPhrases.length : 0;
  }

  private calculateKeywordOverlap(queryWords: string[], textWords: string[]): number {
    const textSet = new Set(textWords);
    let matches = 0;
    let totalWeight = 0;
    
    queryWords.forEach(word => {
      if (textSet.has(word)) {
        matches++;
        // Calculate TF-like score
        const frequency = textWords.filter(w => w === word).length;
        totalWeight += Math.log(1 + frequency) / Math.log(textWords.length + 1);
      }
    });
    
    const coverage = matches / queryWords.length;
    const intensity = totalWeight / queryWords.length;
    
    return coverage * intensity;
  }

  private calculateWordProximity(queryWords: string[], textWords: string[]): number {
    if (queryWords.length < 2) return 0;
    
    let proximityScore = 0;
    let pairCount = 0;
    
    for (let i = 0; i < queryWords.length - 1; i++) {
      for (let j = i + 1; j < queryWords.length; j++) {
        const word1 = queryWords[i];
        const word2 = queryWords[j];
        
        const pos1 = textWords.indexOf(word1);
        const pos2 = textWords.indexOf(word2);
        
        if (pos1 >= 0 && pos2 >= 0) {
          const distance = Math.abs(pos1 - pos2);
          // Closer words get higher scores
          proximityScore += Math.max(0, 1 - (distance / textWords.length));
          pairCount++;
        }
      }
    }
    
    return pairCount > 0 ? proximityScore / pairCount : 0;
  }

  /**
   * Update usage tracking for personal sources
   */
  private async updatePersonalSourceUsage(savedItemIds: string[]): Promise<void> {
    try {
      if (savedItemIds.length === 0) return;
      
      await db
        .update(savedItems)
        .set({
          usage_count: sql`${savedItems.usage_count} + 1`,
          lastUsedAt: new Date(),
          updatedAt: new Date()
        })
        .where(inArray(savedItems.id, savedItemIds));
        
      console.log(`Updated usage tracking for ${savedItemIds.length} saved items`);
    } catch (error) {
      console.error('Error updating saved item usage:', error);
    }
  }

  private isValidString(val: any): val is string {
    return typeof val === 'string' && val.length > 0;
  }
  private isValidArray(val: any): val is any[] {
    return Array.isArray(val);
  }
  private safeDate(val: any): Date | undefined {
    if (!val) return undefined;
    const d = new Date(val);
    return isNaN(d.getTime()) ? undefined : d;
  }
}

// Export singleton instance
export const enhancedRAGService = new EnhancedRAGService();
