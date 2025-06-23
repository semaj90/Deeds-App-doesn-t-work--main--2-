// LLM Orchestration API - Main chat endpoint with Personalized RAG
// This coordinates between multiple AI services and provides personalized retrieval:
// 1. Local Gemma model (via Tauri/Rust backend)
// 2. Python NLP service for entity masking
// 3. Legal analysis and crime suggestions
// 4. Enhanced Personalized RAG from user's saved items
// 5. Advanced source attribution and context assembly

import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { enhancedRAGService } from '$lib/server/rag/enhanced-rag-service';
import type { EnhancedSource } from '$lib/server/rag/enhanced-rag-service';

// Types for the orchestration system
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  id: string;
}

interface LLMRequest {
  message: string;
  caseId?: string;
  context?: any;
  history?: ChatMessage[];
  userId?: string; // Added for personalized retrieval
}

interface NLPAnalysis {
  entities: Array<{
    text: string;
    label: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  sentiment: {
    polarity: number;
    subjectivity: number;
    label: string;
  };
  keywords: Array<{
    text: string;
    score: number;
    frequency: number;
  }>;
  summary?: string;
  language?: string;
}

// Enhanced source interface for personalized retrieval
interface EnhancedSource {
  type: string;
  id: string;
  title: string;
  relevance: number;
  content: string;
  sourceType: 'personal' | 'global'; // Track if from user's saved items or global
  metadata?: {
    userRating?: number;
    usageCount?: number;
    lastUsed?: Date;
    tags?: string[];
    originalQuery?: string;
  };
}

interface LLMResponse {
  success: boolean;
  response?: string;
  analysis?: NLPAnalysis;
  suggestions?: string[];
  sources?: EnhancedSource[];
  personalizedContext?: {
    personalSourcesCount: number;
    totalSourcesRetrieved: number;
    userPreferencesApplied: boolean;
  };
  sessionId?: string;
  error?: string;
}

// Configuration for different AI services
const AI_CONFIG = {
  gemma: {
    url: 'http://localhost:8080/api/generate', // Rust backend
    enabled: true
  },
  pythonNLP: {
    url: 'http://localhost:5000/api/mask',
    enabled: true
  },
  fallback: {
    enabled: true
  }
};

export const POST = async ({ request }: RequestEvent) => {
  try {
    const body: LLMRequest = await request.json();
    const { message, caseId, context, history, userId } = body;

    if (!message || message.trim().length === 0) {
      return json({
        success: false,
        error: 'Message is required'
      } as LLMResponse, { status: 400 });
    }

    console.log('Enhanced LLM Orchestration Request:', { 
      message: message.substring(0, 100) + '...', 
      caseId, 
      context: !!context,
      userId,
      personalized: !!userId
    });

    // Step 1: Perform enhanced personalized retrieval using the RAG service
    const retrievalResults = await enhancedRAGService.retrieveRelevantSources({
      query: message,
      userId,
      caseId,
      contextData: context
    });

    console.log('Enhanced retrieval completed:', retrievalResults.retrievalMetadata);

    // Step 2: Build enhanced context for LLM generation
    const enhancedContext = {
      ...context,
      personalInsights: retrievalResults.personalSources.map(source => ({
        title: source.title,
        content: source.content,
        relevance: source.relevance,
        userRating: source.metadata?.userRating,
        tags: source.metadata?.tags
      })),
      globalSources: retrievalResults.globalSources.map(source => ({
        type: source.type,
        title: source.title,
        content: source.content,
        relevance: source.relevance
      })),
      knowledgeBaseSources: retrievalResults.knowledgeBaseSources.map(source => ({
        title: source.title,
        content: source.content,
        relevance: source.relevance
      })),
      retrievalMetadata: retrievalResults.retrievalMetadata
    };

    // Step 3: Generate response using local Gemma model (via Rust backend)
    let gemmaResponse = '';
    
    if (AI_CONFIG.gemma.enabled) {
      try {
        gemmaResponse = await generateWithGemma(message, history, enhancedContext);
        console.log('Gemma response generated:', gemmaResponse.length, 'characters');
      } catch (error) {
        console.error('Gemma generation failed:', error);
        gemmaResponse = await generateFallbackResponse(message, enhancedContext);
      }
    } else {
      gemmaResponse = await generateFallbackResponse(message, enhancedContext);
    }

    // Step 4: Analyze and mask the response using Python NLP service
    let analysis: NLPAnalysis | undefined;
    let maskedResponse = gemmaResponse;

    if (AI_CONFIG.pythonNLP.enabled && gemmaResponse) {
      try {
        const nlpResult = await analyzeWithPython(gemmaResponse);
        analysis = nlpResult.analysis;
        maskedResponse = nlpResult.maskedText || gemmaResponse;
        console.log('NLP analysis completed:', analysis?.entities?.length || 0, 'entities found');
      } catch (error) {
        console.error('Python NLP analysis failed:', error);
        // Continue with unmasked response
      }
    }

    // Step 5: Generate crime suggestions based on analysis and personalized context
    const suggestions = generateCrimeSuggestions(message, analysis, enhancedContext);

    // Step 6: Generate session ID for tracking
    const sessionId = crypto.randomUUID();

    // Step 7: Return orchestrated response with personalized metadata
    return json({
      success: true,
      response: maskedResponse,
      analysis: analysis,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      sources: retrievalResults.combinedSources,
      personalizedContext: {
        personalSourcesCount: retrievalResults.retrievalMetadata.personalSourcesCount,
        totalSourcesRetrieved: retrievalResults.retrievalMetadata.totalSources,
        userPreferencesApplied: retrievalResults.retrievalMetadata.userPreferencesApplied,
        queryProcessingTime: retrievalResults.retrievalMetadata.queryProcessingTime
      },
      sessionId
    } as LLMResponse);

  } catch (error) {    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as LLMResponse, { status: 500 });
  }
};

// === GENERATION FUNCTIONS ===

// Generate response using local Gemma model via Rust backend
async function generateWithGemma(
  message: string, 
  history?: ChatMessage[], 
  context?: any
): Promise<string> {
  
  // Build enhanced context-aware prompt with personalized retrieval
  let prompt = buildEnhancedLegalPrompt(message, history, context);
  
  try {
    const response = await fetch(AI_CONFIG.gemma.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        max_tokens: 512,
        temperature: 0.7,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      throw new Error(`Gemma API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response || data.text || '';
    
  } catch (error) {
    console.error('Error calling Gemma API:', error);
    throw error;
  }
}

// Analyze text using Python NLP service
async function analyzeWithPython(text: string): Promise<{
  maskedText?: string;
  analysis?: NLPAnalysis;
}> {
  try {
    const response = await fetch(AI_CONFIG.pythonNLP.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`Python NLP API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      maskedText: data.masked_text,
      analysis: {
        entities: data.entities_found || [],
        sentiment: data.sentiment || {
          polarity: 0,
          subjectivity: 0,
          label: 'neutral'
        },
        keywords: data.keywords || [],
        summary: data.summary,
        language: 'en'
      }
    };
    
  } catch (error) {
    console.error('Error calling Python NLP API:', error);
    throw error;
  }
}

// Generate fallback response when AI services are unavailable
async function generateFallbackResponse(message: string, context?: any): Promise<string> {
  console.log('Using fallback response generation');
  
  const responses = [
    "I understand you're asking about legal matters. While my AI analysis services are currently unavailable, I can help you organize your case information.",
    "I'm here to assist with your legal case management. Could you provide more specific details about what you'd like to analyze?",
    "I can help you structure your case analysis. What specific legal question would you like me to address?",
    "Based on your query, I recommend documenting all relevant evidence and organizing case materials systematically.",
    "For legal analysis, it's important to consider all factual evidence, applicable statutes, and procedural requirements."
  ];
  
  // Enhanced fallback with personalized context
  if (context?.personalInsights && context.personalInsights.length > 0) {
    return `I can see you have ${context.personalInsights.length} relevant insights from your saved research. While my AI analysis services are currently unavailable, I recommend reviewing your saved materials on "${context.personalInsights[0].title}" which may be relevant to your current question.`;
  }
  
  // Simple keyword-based response selection
  const keywords = message.toLowerCase();
  if (keywords.includes('crime') || keywords.includes('charge')) {
    return "To analyze potential crimes, I need to review the factual evidence, examine applicable criminal statutes, and consider the elements of each potential offense. Could you provide more details about the specific facts of the case?";
  }
  
  if (keywords.includes('evidence')) {
    return "Evidence analysis is crucial for building a strong case. Consider organizing evidence by relevance, authenticity, and admissibility. What type of evidence are you working with?";
  }
  
  if (keywords.includes('statute') || keywords.includes('law')) {
    return "Legal statute analysis requires careful examination of the elements of each law, jurisdictional requirements, and case precedents. Which specific statutes are you researching?";
  }
  
  // Return random professional response
  return responses[Math.floor(Math.random() * responses.length)];
}

// Build enhanced context-aware prompt for legal AI with personalized retrieval
function buildEnhancedLegalPrompt(message: string, history?: ChatMessage[], context?: any): string {
  let prompt = `You are a legal AI assistant specialized in criminal law and case management. You have access to both general legal knowledge and personalized insights from the user's saved research.

INSTRUCTIONS:
- Provide accurate, professional legal analysis
- Focus on factual evidence and applicable laws
- Suggest relevant criminal charges when appropriate
- Be concise and specific
- Always remind users to consult with qualified attorneys
- When referencing sources, indicate whether they come from the user's personal knowledge base or general legal resources

`;

  // Add personalized insights if available
  if (context?.personalInsights && context.personalInsights.length > 0) {
    prompt += `PERSONALIZED INSIGHTS FROM YOUR SAVED RESEARCH:\n`;
    context.personalInsights.slice(0, 3).forEach((insight: any, index: number) => {
      prompt += `${index + 1}. ${insight.title} (Relevance: ${(insight.relevance * 100).toFixed(0)}%)\n`;
      prompt += `   ${insight.content.substring(0, 200)}...\n`;
      if (insight.tags && insight.tags.length > 0) {
        prompt += `   Tags: ${insight.tags.join(', ')}\n`;
      }
    });
    prompt += `\n`;
  }

  // Add global sources if available
  if (context?.globalSources && context.globalSources.length > 0) {
    prompt += `RELEVANT LEGAL RESOURCES:\n`;
    context.globalSources.slice(0, 3).forEach((source: any, index: number) => {
      prompt += `${index + 1}. ${source.title} (${source.type})\n`;
      prompt += `   ${source.content.substring(0, 150)}...\n`;
    });
    prompt += `\n`;
  }

  // Add knowledge base sources if available
  if (context?.knowledgeBaseSources && context.knowledgeBaseSources.length > 0) {
    prompt += `VERIFIED LEGAL KNOWLEDGE:\n`;
    context.knowledgeBaseSources.slice(0, 2).forEach((source: any, index: number) => {
      prompt += `${index + 1}. ${source.title}\n`;
      prompt += `   ${source.content.substring(0, 150)}...\n`;
    });
    prompt += `\n`;
  }

  // Add case context if available
  if (context?.caseTitle) {
    prompt += `CASE CONTEXT: ${context.caseTitle}\n`;
  }
  
  if (context?.evidence && context.evidence.length > 0) {
    prompt += `EVIDENCE: ${context.evidence.map((e: any) => e.description).join(', ')}\n`;
  }

  // Add conversation history (last 3 exchanges)
  if (history && history.length > 0) {
    prompt += `CONVERSATION HISTORY:\n`;
    const recentHistory = history.slice(-6); // Last 3 exchanges
    recentHistory.forEach(msg => {
      prompt += `${msg.role.toUpperCase()}: ${msg.content}\n`;
    });
  }

  prompt += `\nCURRENT QUESTION: ${message}\n\nRESPONSE:`;
  
  return prompt;
}

// Generate crime suggestions based on analysis and enhanced context
function generateCrimeSuggestions(
  message: string, 
  analysis?: NLPAnalysis, 
  context?: any
): string[] {
  const suggestions: string[] = [];
  const keywords = message.toLowerCase();
  
  // Enhanced suggestions using personalized context
  if (context?.personalInsights) {
    context.personalInsights.forEach((insight: any) => {
      if (insight.tags) {
        insight.tags.forEach((tag: string) => {
          if (tag.toLowerCase().includes('crime') || tag.toLowerCase().includes('charge')) {
            // Extract potential crimes from user's saved insights
            const crimeMatch = tag.match(/(theft|assault|fraud|drug|weapon|traffic|domestic)/i);
            if (crimeMatch) {
              const crimeType = crimeMatch[1].toLowerCase();
              const crimeKeywords = {
                'theft': ['Theft', 'Larceny', 'Burglary'],
                'assault': ['Assault', 'Battery', 'Aggravated Assault'],
                'drug': ['Drug Possession', 'Drug Distribution', 'Controlled Substance Violation'],
                'fraud': ['Fraud', 'Identity Theft', 'Wire Fraud'],
                'weapon': ['Weapons Violation', 'Illegal Possession of Firearm'],
                'traffic': ['Reckless Driving', 'DUI', 'Traffic Violation'],
                'domestic': ['Domestic Violence', 'Harassment', 'Stalking']
              };
              const relatedCrimes = crimeKeywords[crimeType as keyof typeof crimeKeywords];
              if (relatedCrimes) {
                suggestions.push(...relatedCrimes);
              }
            }
          }
        });
      }
    });
  }
  
  // Keyword-based crime suggestions
  const crimeKeywords = {
    'theft': ['Theft', 'Larceny', 'Burglary'],
    'assault': ['Assault', 'Battery', 'Aggravated Assault'],
    'drug': ['Drug Possession', 'Drug Distribution', 'Controlled Substance Violation'],
    'fraud': ['Fraud', 'Identity Theft', 'Wire Fraud'],
    'weapon': ['Weapons Violation', 'Illegal Possession of Firearm'],
    'traffic': ['Reckless Driving', 'DUI', 'Traffic Violation'],
    'domestic': ['Domestic Violence', 'Harassment', 'Stalking']
  };
  
  // Check for keyword matches
  Object.entries(crimeKeywords).forEach(([key, crimes]) => {
    if (keywords.includes(key)) {
      suggestions.push(...crimes);
    }
  });
  
  // Entity-based suggestions
  if (analysis?.entities) {
    analysis.entities.forEach(entity => {
      if (entity.label === 'PERSON' && !suggestions.includes('Identity Theft')) {
        suggestions.push('Identity Theft');
      }
      if (entity.label === 'ORG' && !suggestions.includes('Corporate Fraud')) {
        suggestions.push('Corporate Fraud');
      }
    });
  }
    // Remove duplicates and limit to 5 suggestions
  return [...new Set(suggestions)].slice(0, 5);
}

// === ENHANCED RETRIEVAL FUNCTIONS ===

interface RetrievalResults {
  personalSources: EnhancedSource[];
  globalSources: EnhancedSource[];
  combinedSources: EnhancedSource[];
  userPreferences?: any;
}

async function performEnhancedRetrieval(
  query: string, 
  userId?: string, 
  caseId?: string, 
  context?: any
): Promise<RetrievalResults> {
  const retrievalTasks: Promise<any>[] = [];
  
  // Task 1: Retrieve user's saved items (personalized)
  if (userId) {
    retrievalTasks.push(retrievePersonalSavedItems(query, userId));
  }
  
  // Task 2: Retrieve global sources (cases, evidence, statutes)
  retrievalTasks.push(retrieveGlobalSources(query, caseId, context));
  
  // Task 3: Get user search preferences if available
  if (userId) {
    retrievalTasks.push(getUserSearchPreferences(userId));
  }
  const results = await Promise.allSettled(retrievalTasks);
  
  const personalSources = userId && results[0].status === 'fulfilled' ? (results[0] as PromiseFulfilledResult<any>).value : [];
  const globalSources = results[userId ? 1 : 0].status === 'fulfilled' ? (results[userId ? 1 : 0] as PromiseFulfilledResult<any>).value : [];
  const userPreferences = userId && results[2] && results[2].status === 'fulfilled' ? (results[2] as PromiseFulfilledResult<any>).value : null;
  
  // Combine and re-rank sources
  const combinedSources = combineAndRerankSources(personalSources, globalSources, query, userPreferences);
  
  return {
    personalSources,
    globalSources,
    combinedSources,
    userPreferences
  };
}

async function retrievePersonalSavedItems(query: string, userId: string): Promise<EnhancedSource[]> {
  try {
    console.log('Retrieving personal saved items for user:', userId);
    
    // Get user's saved items with basic text similarity
    const personalItems = await db
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
      .where(eq(savedItems.userId, userId))
      .orderBy(desc(savedItems.lastUsedAt), desc(savedItems.userRating), desc(savedItems.usage_count))
      .limit(10);

    // Calculate relevance scores using basic text similarity
    const scoredItems = personalItems.map(item => {
      const relevance = calculateTextSimilarity(query, item.title + ' ' + item.content + ' ' + (item.originalQuery || ''));
      
      return {
        type: 'saved_item',
        id: item.id,
        title: item.title,
        relevance: Math.min(relevance * 1.2, 1.0), // Boost personal items slightly
        content: item.content,
        sourceType: 'personal' as const,
        metadata: {
          userRating: item.userRating || undefined,
          usageCount: item.usage_count,
          lastUsed: item.lastUsedAt || undefined,
          tags: Array.isArray(item.tags) ? item.tags as string[] : [],
          originalQuery: item.originalQuery || undefined
        }
      };
    });

    // Sort by relevance and return top results
    return scoredItems
      .filter(item => item.relevance > 0.1) // Basic relevance threshold
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 5);

  } catch (error) {
    console.error('Error retrieving personal saved items:', error);
    return [];
  }
}

async function retrieveGlobalSources(query: string, caseId?: string, context?: any): Promise<EnhancedSource[]> {
  try {
    console.log('Retrieving global sources, caseId:', caseId);
    
    const globalSources: EnhancedSource[] = [];
    
    // Get case-specific sources if caseId provided
    if (caseId) {
      const caseData = await db
        .select()
        .from(cases)
        .where(eq(cases.id, caseId))
        .limit(1);
      
      if (caseData.length > 0) {
        const case_ = caseData[0];
        globalSources.push({
          type: 'case',
          id: case_.id,
          title: case_.title,
          relevance: 0.9,
          content: case_.description || 'Case information and background details.',
          sourceType: 'global',
          metadata: {
            tags: Array.isArray(case_.aiTags) ? case_.aiTags as string[] : []
          }
        });
      }
    }

    // Get relevant evidence and statutes with basic text matching
    const [evidenceResults, statuteResults] = await Promise.allSettled([
      db.select().from(evidence).limit(5),
      db.select().from(statutes).limit(5)
    ]);

    if (evidenceResults.status === 'fulfilled') {
      evidenceResults.value.forEach((item, index) => {
        const relevance = calculateTextSimilarity(query, item.title + ' ' + (item.description || ''));
        if (relevance > 0.1) {
          globalSources.push({
            type: 'evidence',
            id: item.id,
            title: item.title,
            relevance: relevance * 0.8, // Slight penalty for global sources
            content: item.description || 'Evidence details and analysis.',
            sourceType: 'global'
          });
        }
      });
    }

    if (statuteResults.status === 'fulfilled') {
      statuteResults.value.forEach((item, index) => {
        const relevance = calculateTextSimilarity(query, item.title + ' ' + (item.content || ''));
        if (relevance > 0.1) {
          globalSources.push({
            type: 'statute',
            id: item.id,
            title: item.title,
            relevance: relevance * 0.8, // Slight penalty for global sources
            content: item.content || 'Legal statute text and provisions.',
            sourceType: 'global'
          });
        }
      });
    }

    return globalSources
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 5);

  } catch (error) {
    console.error('Error retrieving global sources:', error);
    return [];
  }
}

async function getUserSearchPreferences(userId: string): Promise<any> {
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

function combineAndRerankSources(
  personalSources: EnhancedSource[], 
  globalSources: EnhancedSource[], 
  query: string,
  userPreferences?: any
): EnhancedSource[] {
  const allSources = [...personalSources, ...globalSources];
  
  // Apply user preferences if available
  if (userPreferences) {
    const preferredSources = userPreferences.preferredSources || [];
    const excludedSources = userPreferences.excludedSources || [];
    
    allSources.forEach(source => {
      // Boost preferred source types
      if (preferredSources.includes(source.type)) {
        source.relevance = Math.min(source.relevance * 1.3, 1.0);
      }
      
      // Penalize excluded source types
      if (excludedSources.includes(source.type)) {
        source.relevance *= 0.5;
      }
    });
  }
  
  // Sort by relevance and return top 8 sources
  return allSources
    .filter(source => source.relevance > 0.05)
    .sort((a, b) => {
      // Prioritize personal sources with equal relevance
      if (Math.abs(a.relevance - b.relevance) < 0.1) {
        if (a.sourceType === 'personal' && b.sourceType === 'global') return -1;
        if (a.sourceType === 'global' && b.sourceType === 'personal') return 1;
      }
      return b.relevance - a.relevance;
    })
    .slice(0, 8);
}

function calculateTextSimilarity(query: string, text: string): number {
  // Basic text similarity using keyword overlap and TF-IDF-like scoring
  const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  const textWords = text.toLowerCase().split(/\s+/);
  
  if (queryWords.length === 0 || textWords.length === 0) return 0;
  
  let matches = 0;
  let totalWeight = 0;
  
  queryWords.forEach(queryWord => {
    const wordCount = textWords.filter(textWord => 
      textWord.includes(queryWord) || queryWord.includes(textWord)
    ).length;
    
    if (wordCount > 0) {
      matches++;
      // TF-IDF-like scoring: more matches = higher weight, but diminishing returns
      totalWeight += Math.log(1 + wordCount) / Math.log(textWords.length + 1);
    }
  });
  
  // Normalize by query length
  const coverage = matches / queryWords.length;
  const intensity = totalWeight / queryWords.length;
  
  return Math.min(coverage * intensity * 2, 1.0);
}

async function updateSavedItemUsage(savedItemIds: string[]): Promise<void> {
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
      
    console.log('Updated usage tracking for', savedItemIds.length, 'saved items');
  } catch (error) {
    console.error('Error updating saved item usage:', error);
  }
}

function buildEnhancedContext(originalContext: any, retrievalResults: RetrievalResults): any {
  const enhancedContext = { ...originalContext };
  
  // Add personalized sources to context
  if (retrievalResults.personalSources.length > 0) {
    enhancedContext.personalInsights = retrievalResults.personalSources.map(source => ({
      title: source.title,
      content: source.content,
      relevance: source.relevance,
      userRating: source.metadata?.userRating,
      tags: source.metadata?.tags
    }));
  }
  
  // Add global sources to context
  if (retrievalResults.globalSources.length > 0) {
    enhancedContext.globalSources = retrievalResults.globalSources.map(source => ({
      type: source.type,
      title: source.title,
      content: source.content,
      relevance: source.relevance
    }));
  }
  
  // Add retrieval metadata
  enhancedContext.retrievalMetadata = {
    personalSourcesCount: retrievalResults.personalSources.length,
    globalSourcesCount: retrievalResults.globalSources.length,
    hasUserPreferences: !!retrievalResults.userPreferences
  };
  
  return enhancedContext;
}

// === UPDATED GENERATION FUNCTIONS ===

// Generate response using local Gemma model via Rust backend
async function generateWithGemma(
  message: string, 
  history?: ChatMessage[], 
  context?: any
): Promise<string> {
  
  // Build enhanced context-aware prompt with personalized retrieval
  let prompt = buildEnhancedLegalPrompt(message, history, context);
  
  try {
    const response = await fetch(AI_CONFIG.gemma.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        max_tokens: 512,
        temperature: 0.7,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      throw new Error(`Gemma API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response || data.text || '';
    
  } catch (error) {
    console.error('Error calling Gemma API:', error);
    throw error;
  }
}

// Build enhanced context-aware prompt for legal AI with personalized retrieval
function buildEnhancedLegalPrompt(message: string, history?: ChatMessage[], context?: any): string {
  let prompt = `You are a legal AI assistant specialized in criminal law and case management. You have access to both general legal knowledge and personalized insights from the user's saved research.

INSTRUCTIONS:
- Provide accurate, professional legal analysis
- Focus on factual evidence and applicable laws
- Suggest relevant criminal charges when appropriate
- Be concise and specific
- Always remind users to consult with qualified attorneys
- When referencing sources, indicate whether they come from the user's personal knowledge base or general legal resources

`;

  // Add personalized insights if available
  if (context?.personalInsights && context.personalInsights.length > 0) {
    prompt += `PERSONALIZED INSIGHTS FROM YOUR SAVED RESEARCH:\n`;
    context.personalInsights.slice(0, 3).forEach((insight: any, index: number) => {
      prompt += `${index + 1}. ${insight.title} (Relevance: ${(insight.relevance * 100).toFixed(0)}%)\n`;
      prompt += `   ${insight.content.substring(0, 200)}...\n`;
      if (insight.tags && insight.tags.length > 0) {
        prompt += `   Tags: ${insight.tags.join(', ')}\n`;
      }
    });
    prompt += `\n`;
  }

  // Add global sources if available
  if (context?.globalSources && context.globalSources.length > 0) {
    prompt += `RELEVANT LEGAL RESOURCES:\n`;
    context.globalSources.slice(0, 3).forEach((source: any, index: number) => {
      prompt += `${index + 1}. ${source.title} (${source.type})\n`;
      prompt += `   ${source.content.substring(0, 150)}...\n`;
    });
    prompt += `\n`;
  }

  // Add case context if available
  if (context?.caseTitle) {
    prompt += `CASE CONTEXT: ${context.caseTitle}\n`;
  }
  
  if (context?.evidence && context.evidence.length > 0) {
    prompt += `EVIDENCE: ${context.evidence.map((e: any) => e.description).join(', ')}\n`;
  }

  // Add conversation history (last 3 exchanges)
  if (history && history.length > 0) {
    prompt += `CONVERSATION HISTORY:\n`;
    const recentHistory = history.slice(-6); // Last 3 exchanges
    recentHistory.forEach(msg => {
      prompt += `${msg.role.toUpperCase()}: ${msg.content}\n`;
    });
  }

  prompt += `\nCURRENT QUESTION: ${message}\n\nRESPONSE:`;
  
  return prompt;
}

// Analyze text using Python NLP service
async function analyzeWithPython(text: string): Promise<{
  maskedText?: string;
  analysis?: NLPAnalysis;
}> {
  try {
    const response = await fetch(AI_CONFIG.pythonNLP.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`Python NLP API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      maskedText: data.masked_text,
      analysis: {
        entities: data.entities_found || [],
        sentiment: data.sentiment || {
          polarity: 0,
          subjectivity: 0,
          label: 'neutral'
        },
        keywords: data.keywords || [],
        summary: data.summary,
        language: 'en'
      }
    };
    
  } catch (error) {
    console.error('Error calling Python NLP API:', error);
    throw error;
  }
}

// Generate fallback response when AI services are unavailable
async function generateFallbackResponse(message: string, context?: any): Promise<string> {
  console.log('Using fallback response generation');
  
  const responses = [
    "I understand you're asking about legal matters. While my AI analysis services are currently unavailable, I can help you organize your case information.",
    "I'm here to assist with your legal case management. Could you provide more specific details about what you'd like to analyze?",
    "I can help you structure your case analysis. What specific legal question would you like me to address?",
    "Based on your query, I recommend documenting all relevant evidence and organizing case materials systematically.",
    "For legal analysis, it's important to consider all factual evidence, applicable statutes, and procedural requirements."
  ];
  
  // Enhanced fallback with personalized context
  if (context?.personalInsights && context.personalInsights.length > 0) {
    return `I can see you have ${context.personalInsights.length} relevant insights from your saved research. While my AI analysis services are currently unavailable, I recommend reviewing your saved materials on "${context.personalInsights[0].title}" which may be relevant to your current question.`;
  }
  
  // Simple keyword-based response selection
  const keywords = message.toLowerCase();
  if (keywords.includes('crime') || keywords.includes('charge')) {
    return "To analyze potential crimes, I need to review the factual evidence, examine applicable criminal statutes, and consider the elements of each potential offense. Could you provide more details about the specific facts of the case?";
  }
  
  if (keywords.includes('evidence')) {
    return "Evidence analysis is crucial for building a strong case. Consider organizing evidence by relevance, authenticity, and admissibility. What type of evidence are you working with?";
  }
  
  if (keywords.includes('statute') || keywords.includes('law')) {
    return "Legal statute analysis requires careful examination of the elements of each law, jurisdictional requirements, and case precedents. Which specific statutes are you researching?";
  }
  
  // Return random professional response
  return responses[Math.floor(Math.random() * responses.length)];
}

// Generate crime suggestions based on analysis and enhanced context
function generateCrimeSuggestions(
  message: string, 
  analysis?: NLPAnalysis, 
  context?: any
): string[] {
  const suggestions: string[] = [];
  const keywords = message.toLowerCase();
  
  // Enhanced suggestions using personalized context
  if (context?.personalInsights) {
    context.personalInsights.forEach((insight: any) => {
      if (insight.tags) {
        insight.tags.forEach((tag: string) => {
          if (tag.toLowerCase().includes('crime') || tag.toLowerCase().includes('charge')) {
            // Extract potential crimes from user's saved insights
            const crimeMatch = tag.match(/(theft|assault|fraud|drug|weapon|traffic|domestic)/i);
            if (crimeMatch) {
              const crimeType = crimeMatch[1].toLowerCase();
              const crimeKeywords = {
                'theft': ['Theft', 'Larceny', 'Burglary'],
                'assault': ['Assault', 'Battery', 'Aggravated Assault'],
                'drug': ['Drug Possession', 'Drug Distribution', 'Controlled Substance Violation'],
                'fraud': ['Fraud', 'Identity Theft', 'Wire Fraud'],
                'weapon': ['Weapons Violation', 'Illegal Possession of Firearm'],
                'traffic': ['Reckless Driving', 'DUI', 'Traffic Violation'],
                'domestic': ['Domestic Violence', 'Harassment', 'Stalking']
              };
              const relatedCrimes = crimeKeywords[crimeType as keyof typeof crimeKeywords];
              if (relatedCrimes) {
                suggestions.push(...relatedCrimes);
              }
            }
          }
        });
      }
    });
  }
  
  // Keyword-based crime suggestions
  const crimeKeywords = {
    'theft': ['Theft', 'Larceny', 'Burglary'],
    'assault': ['Assault', 'Battery', 'Aggravated Assault'],
    'drug': ['Drug Possession', 'Drug Distribution', 'Controlled Substance Violation'],
    'fraud': ['Fraud', 'Identity Theft', 'Wire Fraud'],
    'weapon': ['Weapons Violation', 'Illegal Possession of Firearm'],
    'traffic': ['Reckless Driving', 'DUI', 'Traffic Violation'],
    'domestic': ['Domestic Violence', 'Harassment', 'Stalking']
  };
  
  // Check for keyword matches
  Object.entries(crimeKeywords).forEach(([key, crimes]) => {
    if (keywords.includes(key)) {
      suggestions.push(...crimes);
    }
  });
  
  // Entity-based suggestions
  if (analysis?.entities) {
    analysis.entities.forEach(entity => {
      if (entity.label === 'PERSON' && !suggestions.includes('Identity Theft')) {
        suggestions.push('Identity Theft');
      }
      if (entity.label === 'ORG' && !suggestions.includes('Corporate Fraud')) {
        suggestions.push('Corporate Fraud');
      }
    });
  }
    // Remove duplicates and limit to 5 suggestions
  return [...new Set(suggestions)].slice(0, 5);
}

// Generate sources based on message content and context
function generateSources(
  message: string, 
  context?: any, 
  analysis?: NLPAnalysis
): Array<{
  type: string;
  id: string;
  title: string;
  relevance: number;
  content: string;
}> {
  const sources: Array<{
    type: string;
    id: string;
    title: string;
    relevance: number;
    content: string;
  }> = [];
  
  // Add case-related sources if context is available
  if (context?.caseTitle) {
    sources.push({
      type: 'case',
      id: context.caseId || 'case-1',
      title: context.caseTitle,
      relevance: 0.9,
      content: `Case details and background information for ${context.caseTitle}. This case provides relevant legal precedent and context for the current analysis.`
    });
  }

  // Add evidence sources
  if (context?.evidence && Array.isArray(context.evidence)) {
    context.evidence.slice(0, 3).forEach((evidence: any, index: number) => {
      sources.push({
        type: 'evidence',
        id: evidence.id || `evidence-${index + 1}`,
        title: evidence.title || evidence.filename || `Evidence ${index + 1}`,
        relevance: 0.8 - (index * 0.1),
        content: evidence.description || evidence.summary || `Physical evidence collected in relation to the case.`
      });
    });
  }

  // Add statute sources based on keywords
  const keywords = message.toLowerCase();
  const statuteMapping = {
    'theft': {
      title: 'Theft and Larceny Statutes',
      content: 'Legal definitions and penalties for theft, larceny, and related property crimes under state and federal law.'
    },
    'assault': {
      title: 'Assault and Battery Laws',
      content: 'Criminal statutes defining assault, battery, and aggravated assault with corresponding penalties and classifications.'
    },
    'drug': {
      title: 'Controlled Substances Act',
      content: 'Federal and state laws governing controlled substances, possession, distribution, and trafficking offenses.'
    },
    'fraud': {
      title: 'Fraud and White Collar Crime Statutes',
      content: 'Legal framework for fraud, embezzlement, identity theft, and other white collar criminal offenses.'
    }
  };

  Object.entries(statuteMapping).forEach(([keyword, statute], index) => {
    if (keywords.includes(keyword)) {
      sources.push({
        type: 'statute',
        id: `statute-${keyword}`,
        title: statute.title,
        relevance: 0.7 - (index * 0.05),
        content: statute.content
      });
    }
  });

  // Add entity-based sources if analysis is available
  if (analysis?.entities) {
    analysis.entities.slice(0, 2).forEach((entity, index) => {
      if (entity.label === 'PERSON' || entity.label === 'ORG') {
        sources.push({
          type: 'entity',
          id: `entity-${entity.text.replace(/\s+/g, '-').toLowerCase()}`,
          title: `${entity.label}: ${entity.text}`,
          relevance: entity.confidence || 0.6,
          content: `Relevant information about ${entity.text} (${entity.label}) identified in the legal context.`
        });
      }
    });
  }

  // Add default legal resources if no specific sources found
  if (sources.length === 0) {
    sources.push({
      type: 'resource',
      id: 'general-legal-principles',
      title: 'General Legal Principles',
      relevance: 0.5,
      content: 'Fundamental legal principles and guidelines applicable to criminal law analysis and case preparation.'
    });
  }

  // Sort by relevance and limit to top 5 sources
  return sources.sort((a, b) => b.relevance - a.relevance).slice(0, 5);
}
