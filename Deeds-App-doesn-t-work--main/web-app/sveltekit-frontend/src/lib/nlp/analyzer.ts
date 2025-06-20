// Advanced NLP Analyzer for Case Management
import { db } from '$lib/server/db';
import { cases, caseRelationships, nlpAnalysisCache, savedStatements, caseTextFragments } from '$lib/server/db/schema';
import { eq, like, sql, desc, and } from 'drizzle-orm';
import crypto from 'crypto';

export interface CaseAnalysis {
  entities: ExtractedEntity[];
  predictions: CasePrediction;
  relatedLaws: RelatedLaw[];
  relatedCases: RelatedCase[];
  embedding: number[];
  confidence: number;
  sentiment: number;
  suggestions: AnalysisSuggestion[];
}

export interface ExtractedEntity {
  type: 'person' | 'location' | 'crime' | 'date' | 'organization' | 'evidence';
  value: string;
  confidence: number;
  context?: string;
}

export interface CasePrediction {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  expectedOutcome: string;
  confidence: number;
  reasoning: string[];
}

export interface RelatedLaw {
  statuteId: string;
  relevance: number;
  reasoning: string;
  sections: string[];
}

export interface RelatedCase {
  caseId: string;
  similarity: number;
  relationshipType: 'similar' | 'related' | 'duplicate';
  sharedEntities: string[];
  reasoning: string;
}

export interface AnalysisSuggestion {
  type: 'merge_cases' | 'add_evidence' | 'legal_research' | 'follow_up' | 'template';
  title: string;
  description: string;
  actionData: any;
  priority: 'low' | 'medium' | 'high';
}

export class PredictiveAnalyzer {
  private stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);
  
  private crimeKeywords = {
    'assault': ['assault', 'attack', 'hit', 'strike', 'beat', 'punch', 'kick'],
    'theft': ['steal', 'theft', 'rob', 'burglar', 'larceny', 'shoplifting'],
    'drug': ['drug', 'narcotics', 'cocaine', 'marijuana', 'heroin', 'meth', 'substance'],
    'fraud': ['fraud', 'scam', 'deceive', 'embezzle', 'forgery', 'counterfeit'],
    'violence': ['violence', 'murder', 'homicide', 'kill', 'shoot', 'stab', 'weapon']
  };

  async analyzeCaseDescription(description: string, caseId?: string): Promise<CaseAnalysis> {
    // Check cache first
    const contentHash = this.generateContentHash(description);
    const cached = await this.getCachedAnalysis(contentHash);
    
    if (cached) {
      return this.parseCachedAnalysis(cached);
    }

    // Perform full analysis
    const entities = await this.extractEntities(description);
    const predictions = await this.predictCaseOutcome(description, entities);
    const relatedLaws = await this.findRelatedStatutes(entities);
    const relatedCases = await this.findRelatedCases(description, entities, caseId);
    const embedding = await this.generateEmbedding(description);
    const sentiment = this.analyzeSentiment(description);
    const suggestions = await this.generateSuggestions(entities, predictions, relatedCases);

    const analysis: CaseAnalysis = {
      entities,
      predictions,
      relatedLaws,
      relatedCases,
      embedding,
      confidence: predictions.confidence,
      sentiment,
      suggestions
    };

    // Cache the analysis
    await this.cacheAnalysis(contentHash, description, analysis);

    return analysis;
  }

  private async extractEntities(text: string): Promise<ExtractedEntity[]> {
    const entities: ExtractedEntity[] = [];
    const words = text.toLowerCase().split(/\s+/);
    
    // Simple regex-based entity extraction (in production, use spaCy or similar)
    
    // Dates
    const dateRegex = /\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})\b/g;
    const dates = text.match(dateRegex) || [];
    dates.forEach(date => {
      entities.push({
        type: 'date',
        value: date,
        confidence: 0.9
      });
    });

    // Names (simple pattern - capitalized words)
    const nameRegex = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
    const names = text.match(nameRegex) || [];
    names.forEach(name => {
      entities.push({
        type: 'person',
        value: name,
        confidence: 0.7
      });
    });

    // Crime types
    for (const [crimeType, keywords] of Object.entries(this.crimeKeywords)) {
      for (const keyword of keywords) {
        if (words.includes(keyword)) {
          entities.push({
            type: 'crime',
            value: crimeType,
            confidence: 0.8,
            context: keyword
          });
        }
      }
    }

    // Locations (words ending with street, avenue, etc.)
    const locationRegex = /\b\d+\s+[A-Z][a-z\s]+(Street|Avenue|Road|Drive|Lane|Boulevard|Way|Court|Place)\b/gi;
    const locations = text.match(locationRegex) || [];
    locations.forEach(location => {
      entities.push({
        type: 'location',
        value: location,
        confidence: 0.8
      });
    });

    return entities;
  }

  private async predictCaseOutcome(description: string, entities: ExtractedEntity[]): Promise<CasePrediction> {
    // Simple prediction based on keywords and entities
    const crimeEntities = entities.filter(e => e.type === 'crime');
    const hasViolence = crimeEntities.some(e => e.value === 'violence' || e.value === 'assault');
    const hasDrugs = crimeEntities.some(e => e.value === 'drug');
    const hasTheft = crimeEntities.some(e => e.value === 'theft');
    
    let category = 'miscellaneous';
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let expectedOutcome = 'investigation';
    const reasoning: string[] = [];

    if (hasViolence) {
      category = 'violent_crime';
      severity = 'high';
      expectedOutcome = 'felony_charges';
      reasoning.push('Violence-related keywords detected');
    } else if (hasDrugs) {
      category = 'drug_offense';
      severity = 'medium';
      expectedOutcome = 'misdemeanor_or_felony';
      reasoning.push('Drug-related keywords detected');
    } else if (hasTheft) {
      category = 'property_crime';
      severity = 'medium';
      expectedOutcome = 'restitution_and_charges';
      reasoning.push('Theft-related keywords detected');
    }

    // Adjust severity based on entity count and description length
    if (entities.length > 10) {
      severity = severity === 'low' ? 'medium' : 'high';
      reasoning.push('High entity count suggests complex case');
    }

    return {
      category,
      severity,
      expectedOutcome,
      confidence: Math.min(0.9, entities.length * 0.1 + 0.5),
      reasoning
    };
  }

  private async findRelatedStatutes(entities: ExtractedEntity[]): Promise<RelatedLaw[]> {
    const relatedLaws: RelatedLaw[] = [];
    
    // This would normally query a legal database or use ML
    const crimeEntities = entities.filter(e => e.type === 'crime');
    
    for (const entity of crimeEntities) {
      // Mock statute matching - in production, use semantic search
      relatedLaws.push({
        statuteId: `statute_${entity.value}`,
        relevance: entity.confidence,
        reasoning: `Matches crime type: ${entity.value}`,
        sections: [`Section ${Math.floor(Math.random() * 100) + 1}`]
      });
    }

    return relatedLaws.slice(0, 5); // Top 5 most relevant
  }

  private async findRelatedCases(description: string, entities: ExtractedEntity[], excludeCaseId?: string): Promise<RelatedCase[]> {
    try {
      // Find cases with similar entities or keywords
      const keywords = entities.map(e => e.value).join(' ');
      
      let query = db.select().from(cases);
      
      if (excludeCaseId) {
        query = query.where(sql`${cases.id} != ${excludeCaseId}`);
      }

      // Simple keyword matching (in production, use vector similarity)
      if (keywords) {
        query = query.where(
          sql`${cases.description} LIKE ${'%' + keywords + '%'} OR ${cases.title} LIKE ${'%' + keywords + '%'}`
        );
      }

      const similarCases = await query.limit(10);
      
      const relatedCases: RelatedCase[] = [];
      
      for (const similarCase of similarCases) {
        const sharedEntities = this.findSharedEntities(entities, similarCase.description || '');
        
        if (sharedEntities.length > 0) {
          relatedCases.push({
            caseId: similarCase.id,
            similarity: sharedEntities.length / entities.length,
            relationshipType: sharedEntities.length > 3 ? 'similar' : 'related',
            sharedEntities,
            reasoning: `Shares ${sharedEntities.length} entities: ${sharedEntities.slice(0, 3).join(', ')}`
          });
        }
      }

      return relatedCases.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
    } catch (error) {
      console.error('Error finding related cases:', error);
      return [];
    }
  }

  private findSharedEntities(entities: ExtractedEntity[], text: string): string[] {
    const shared: string[] = [];
    const lowerText = text.toLowerCase();
    
    for (const entity of entities) {
      if (lowerText.includes(entity.value.toLowerCase())) {
        shared.push(entity.value);
      }
    }
    
    return shared;
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Simple TF-IDF style embedding (in production, use sentence transformers or OpenAI embeddings)
    const words = text.toLowerCase().split(/\s+/).filter(word => !this.stopWords.has(word));
    const wordCounts = new Map<string, number>();
    
    words.forEach(word => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });
    
    // Create a simple vector representation
    const embedding = Array(100).fill(0);
    let index = 0;
    
    for (const [word, count] of wordCounts.entries()) {
      if (index >= embedding.length) break;
      embedding[index] = count / words.length;
      index++;
    }
    
    return embedding;
  }

  private analyzeSentiment(text: string): number {
    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'successful', 'resolved'];
    const negativeWords = ['bad', 'terrible', 'negative', 'failed', 'problem', 'issue', 'crime', 'violent'];
    
    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });
    
    return Math.max(-1, Math.min(1, score / words.length));
  }

  private async generateSuggestions(entities: ExtractedEntity[], predictions: CasePrediction, relatedCases: RelatedCase[]): Promise<AnalysisSuggestion[]> {
    const suggestions: AnalysisSuggestion[] = [];

    // Suggest case merging if high similarity
    const highSimilarityCases = relatedCases.filter(c => c.similarity > 0.7);
    if (highSimilarityCases.length > 0) {
      suggestions.push({
        type: 'merge_cases',
        title: 'Similar Cases Detected',
        description: `Found ${highSimilarityCases.length} highly similar case(s). Consider merging or linking them.`,
        actionData: { cases: highSimilarityCases },
        priority: 'high'
      });
    }

    // Suggest templates based on case type
    if (predictions.category !== 'miscellaneous') {
      suggestions.push({
        type: 'template',
        title: 'Use Case Template',
        description: `Apply ${predictions.category} template to auto-fill common fields.`,
        actionData: { category: predictions.category },
        priority: 'medium'
      });
    }

    // Suggest evidence collection for high-severity cases
    if (predictions.severity === 'high' || predictions.severity === 'critical') {
      suggestions.push({
        type: 'add_evidence',
        title: 'Evidence Collection Priority',
        description: 'High-severity case detected. Prioritize evidence collection and documentation.',
        actionData: { severity: predictions.severity },
        priority: 'high'
      });
    }

    return suggestions;
  }

  private generateContentHash(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  private async getCachedAnalysis(contentHash: string): Promise<any> {
    try {
      const cached = await db.select()
        .from(nlpAnalysisCache)
        .where(and(
          eq(nlpAnalysisCache.contentHash, contentHash),
          sql`${nlpAnalysisCache.expiresAt} > ${new Date()}`
        ))
        .limit(1);

      return cached[0] || null;
    } catch (error) {
      console.error('Error getting cached analysis:', error);
      return null;
    }
  }

  private parseCachedAnalysis(cached: any): CaseAnalysis {
    return {
      entities: cached.entities || [],
      predictions: JSON.parse(cached.analysis).predictions || {},
      relatedLaws: cached.relatedStatutes || [],
      relatedCases: cached.relatedCases || [],
      embedding: cached.embedding || [],
      confidence: cached.confidence || 0,
      sentiment: cached.sentiment || 0,
      suggestions: cached.suggestions || []
    };
  }

  private async cacheAnalysis(contentHash: string, originalText: string, analysis: CaseAnalysis): Promise<void> {
    try {
      await db.insert(nlpAnalysisCache).values({
        id: crypto.randomUUID(),
        contentHash,
        contentType: 'case_description',
        originalText,
        analysis: JSON.stringify(analysis),
        entities: analysis.entities,
        sentiment: analysis.sentiment,
        confidence: analysis.confidence,
        suggestions: analysis.suggestions,
        relatedCases: analysis.relatedCases,
        relatedStatutes: analysis.relatedLaws,
        embedding: analysis.embedding
      });
    } catch (error) {
      console.error('Error caching analysis:', error);
    }
  }

  // Recent cases for auto-completion
  async getRecentCases(userId: string, limit: number = 10): Promise<any[]> {
    try {
      return await db.select()
        .from(cases)
        .where(eq(cases.createdBy, userId))
        .orderBy(desc(cases.updatedAt))
        .limit(limit);
    } catch (error) {
      console.error('Error getting recent cases:', error);
      return [];
    }
  }

  // Get saved statements for auto-completion
  async getSavedStatements(category?: string, userId?: string): Promise<any[]> {
    try {
      let query = db.select().from(savedStatements);
      
      if (category) {
        query = query.where(eq(savedStatements.category, category));
      }
      
      return await query.orderBy(desc(savedStatements.usageCount)).limit(20);
    } catch (error) {
      console.error('Error getting saved statements:', error);
      return [];
    }
  }
}

// Global instance
export const predictiveAnalyzer = new PredictiveAnalyzer();
