// API endpoint for NLP-powered case recommendations
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { cases, nlpAnalysisCache, savedStatements } from '$lib/server/db/schema';
import { eq, desc, and, like } from 'drizzle-orm';
import { cache } from '$lib/server/cache/cache';

// POST /api/nlp/recommendations - Get NLP-powered case recommendations
export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  if (!user?.id) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { caseIds, userId, analysisType = 'comprehensive' } = await request.json();

    if (!caseIds || caseIds.length === 0) {
      return json({ error: 'Case IDs are required' }, { status: 400 });
    }

    // Get cases for analysis
    const userCases = await db.select()
      .from(cases)
      .where(and(
        eq(cases.createdBy, user.id)
      ))
      .orderBy(desc(cases.updatedAt))
      .limit(50); // Analyze recent cases

    const targetCases = userCases.filter(c => caseIds.includes(c.id));
    const allCases = userCases;

    // Generate different types of recommendations
    const recommendations = await generateRecommendations(targetCases, allCases, user.id, analysisType);

    return json({
      success: true,
      recommendations,
      analysisType,
      targetCasesCount: targetCases.length,
      totalCasesAnalyzed: allCases.length
    });

  } catch (error) {
    console.error('NLP recommendations error:', error);
    return json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
};

// GET /api/nlp/recommendations/patterns - Get pattern-based recommendations for new cases
export const GET: RequestHandler = async ({ url, locals }) => {
  const user = locals.user;
  if (!user?.id) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cacheKey = `nlp-patterns:${user.id}`;
    
    // Try cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      return json(cached);
    }

    // Get user's case patterns
    const userCases = await db.select()
      .from(cases)
      .where(eq(cases.createdBy, user.id))
      .orderBy(desc(cases.createdAt))
      .limit(100);

    // Get saved statements
    const statements = await db.select()
      .from(savedStatements)
      .where(eq(savedStatements.createdBy, user.id))
      .orderBy(desc(savedStatements.updatedAt))
      .limit(50);

    // Analyze patterns and generate suggestions
    const patterns = await analyzeUserPatterns(userCases, statements);
    const suggestions = await generateNewCaseSuggestions(patterns, user.id);

    const result = {
      patterns,
      suggestions,
      generatedAt: new Date().toISOString()
    };

    // Cache for 30 minutes (assume cache.set(key, value, ttlMs))
    cache.set(cacheKey, result, 1800000);

    return json(result);

  } catch (error) {
    console.error('NLP patterns error:', error);
    return json(
      { error: 'Failed to generate patterns' },
      { status: 500 }
    );
  }
};

// Helper functions for recommendation generation
async function generateRecommendations(targetCases: any[], allCases: any[], userId: string, analysisType: string) {
  const recommendations: any[] = [];

  // 1. Case Relationship Analysis
  for (const targetCase of targetCases) {
    const relatedCases = findRelatedCases(targetCase, allCases);
    if (relatedCases.length > 0) {
      recommendations.push({
        id: `related-${targetCase.id}`,
        type: 'related_cases',
        targetCaseId: targetCase.id,
        targetTitle: targetCase.title,
        title: 'Related Cases Found',
        description: `Found ${relatedCases.length} cases that appear to be related to "${targetCase.title}"`,
        confidence: calculateAverageConfidence(relatedCases),
        relatedCases: relatedCases.slice(0, 5), // Top 5 related
        actionType: 'merge_or_link',
        priority: relatedCases.length > 2 ? 'high' : 'medium'
      });
    }
  }

  // 2. Missing Information Analysis
  for (const targetCase of targetCases) {
    const missingInfo = analyzeMissingInformation(targetCase);
    if (missingInfo.length > 0) {
      recommendations.push({
        id: `missing-${targetCase.id}`,
        type: 'missing_information',
        targetCaseId: targetCase.id,
        title: 'Incomplete Case Information',
        description: `Case "${targetCase.title}" appears to be missing key information`,
        missingFields: missingInfo,
        suggestions: generateCompletionSuggestions(missingInfo),
        actionType: 'complete_case',
        priority: 'medium'
      });
    }
  }

  // 3. New Case Suggestions Based on Patterns
  const newCaseSuggestions = await generateNewCasePatterns(allCases);
  recommendations.push(...newCaseSuggestions);

  // 4. Text Organization Suggestions
  for (const targetCase of targetCases) {
    const textSuggestions = analyzeTextOrganization(targetCase);
    if (textSuggestions.length > 0) {
      recommendations.push({
        id: `text-org-${targetCase.id}`,
        type: 'text_organization',
        targetCaseId: targetCase.id,
        title: 'Text Organization Suggestions',
        description: `Suggestions for better organizing content in "${targetCase.title}"`,
        suggestions: textSuggestions,
        actionType: 'reorganize_text',
        priority: 'low'
      });
    }
  }

  // Sort by priority and confidence
  return recommendations
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return (b.confidence || 0) - (a.confidence || 0);
    })
    .slice(0, 10); // Return top 10 recommendations
}

function findRelatedCases(targetCase: any, allCases: any[]): any[] {
  const related: any[] = [];
  
  for (const candidate of allCases) {
    if (candidate.id === targetCase.id) continue;
    
    const similarity = calculateCaseSimilarity(targetCase, candidate);
    if (similarity > 0.3) { // Minimum similarity threshold
      related.push({
        case: candidate,
        similarity,
        reasons: getRelationshipReasons(targetCase, candidate)
      });
    }
  }
  
  return related.sort((a, b) => b.similarity - a.similarity);
}

function calculateCaseSimilarity(case1: any, case2: any): number {
  let score = 0;
  
  // Title similarity
  const title1Words = case1.title.toLowerCase().split(/\s+/);
  const title2Words = case2.title.toLowerCase().split(/\s+/);
  const titleOverlap = title1Words.filter((word: string) => title2Words.includes(word)).length;
  score += (titleOverlap / Math.max(title1Words.length, title2Words.length)) * 0.4;
  
  // Description similarity
  const desc1Words = case1.description.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
  const desc2Words = case2.description.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
  const descOverlap = desc1Words.filter((word: string) => desc2Words.includes(word)).length;
  score += (descOverlap / Math.max(desc1Words.length, desc2Words.length)) * 0.5;
  
  // Data similarity (tags, types, etc.)
  const data1 = JSON.parse(case1.data || '{}');
  const data2 = JSON.parse(case2.data || '{}');
  
  if (data1.caseType && data2.caseType && data1.caseType === data2.caseType) {
    score += 0.1;
  }
  
  return Math.min(score, 1.0);
}

function getRelationshipReasons(case1: any, case2: any): string[] {
  const reasons: string[] = [];
  
  const title1Words = case1.title.toLowerCase().split(/\s+/);
  const title2Words = case2.title.toLowerCase().split(/\s+/);
  const commonTitleWords = title1Words.filter((word: string) => title2Words.includes(word));
  
  if (commonTitleWords.length > 0) {
    reasons.push(`Common title words: ${commonTitleWords.join(', ')}`);
  }
  
  const data1 = JSON.parse(case1.data || '{}');
  const data2 = JSON.parse(case2.data || '{}');
  
  if (data1.caseType && data2.caseType && data1.caseType === data2.caseType) {
    reasons.push(`Same case type: ${data1.caseType}`);
  }
  
  return reasons;
}

function analyzeMissingInformation(case_: any): string[] {
  const missing: string[] = [];
  const data = JSON.parse(case_.data || '{}');
  
  if (!case_.title || case_.title.length < 5) {
    missing.push('Title is too short or missing');
  }
  
  if (!case_.description || case_.description.length < 50) {
    missing.push('Description is incomplete');
  }
  
  if (!data.caseType) {
    missing.push('Case type not specified');
  }
  
  if (!data.priority) {
    missing.push('Priority level not set');
  }
  
  if (!data.tags || data.tags.length === 0) {
    missing.push('No tags assigned');
  }
  
  return missing;
}

function generateCompletionSuggestions(missingFields: string[]): string[] {
  const suggestions: string[] = [];
  
  for (const field of missingFields) {
    switch (field) {
      case 'Title is too short or missing':
        suggestions.push('Consider adding more descriptive keywords to the title');
        break;
      case 'Description is incomplete':
        suggestions.push('Add more details about the case circumstances');
        break;
      case 'Case type not specified':
        suggestions.push('Categorize the case (Criminal, Civil, Corporate, etc.)');
        break;
      case 'Priority level not set':
        suggestions.push('Assign a priority level based on urgency and importance');
        break;
      case 'No tags assigned':
        suggestions.push('Add relevant tags for better organization');
        break;
    }
  }
  
  return suggestions;
}

function analyzeTextOrganization(case_: any): any[] {
  const suggestions: any[] = [];
  const description = case_.description;
  
  // Check for very long paragraphs
  const paragraphs = description.split(/\n\s*\n/);
  const longParagraphs = paragraphs.filter((p: string) => p.length > 500);
  
  if (longParagraphs.length > 0) {
    suggestions.push({
      type: 'split_paragraphs',
      issue: 'Long paragraphs detected',
      suggestion: 'Consider breaking down large paragraphs for better readability',
      affected: longParagraphs.length
    });
  }
  
  // Check for unstructured lists
  if (description.includes('1.') || description.includes('-') || description.includes('•')) {
    suggestions.push({
      type: 'format_lists',
      issue: 'Unformatted lists detected',
      suggestion: 'Format lists with proper markdown or move to structured fields',
      affected: 1
    });
  }
  
  return suggestions;
}

async function generateNewCasePatterns(allCases: any[]): Promise<any[]> {
  const patterns = analyzeCommonPatterns(allCases);
  const suggestions: any[] = [];
  
  for (const pattern of patterns) {
    suggestions.push({
      id: `new-case-${pattern.type}`,
      type: 'new_case',
      title: `Pick up on this case: ${pattern.suggestedTitle}`,
      description: pattern.description,
      pattern: pattern.pattern,
      suggestedTitle: pattern.suggestedTitle,
      confidence: pattern.confidence,
      actionType: 'create_case',
      priority: pattern.confidence > 0.7 ? 'high' : 'medium',
      templateData: pattern.templateData
    });
  }
  
  return suggestions.slice(0, 3); // Top 3 new case suggestions
}

function analyzeCommonPatterns(cases: any[]): any[] {
  const patterns: any[] = [];
  
  // Find common case types
  const caseTypeFreq: { [key: string]: number } = {};
  const caseTypeTitles: { [key: string]: string[] } = {};
  
  for (const case_ of cases) {
    const data = JSON.parse(case_.data || '{}');
    const caseType = data.caseType || 'unknown';
    
    caseTypeFreq[caseType] = (caseTypeFreq[caseType] || 0) + 1;
    if (!caseTypeTitles[caseType]) {
      caseTypeTitles[caseType] = [];
    }
    caseTypeTitles[caseType].push(case_.title);
  }
  
  // Generate patterns for frequent case types
  for (const [caseType, frequency] of Object.entries(caseTypeFreq)) {
    if (frequency >= 3 && caseType !== 'unknown') {
      const titles = caseTypeTitles[caseType];
      const suggestedTitle = generateSuggestedTitle(titles, caseType);
      
      patterns.push({
        type: `frequent-${caseType}`,
        pattern: `Frequent ${caseType} cases`,
        suggestedTitle,
        description: `You've created ${frequency} ${caseType} cases. Consider creating another similar case.`,
        confidence: Math.min(frequency / 10, 0.8),
        templateData: {
          caseType,
          priority: 'medium',
          tags: [caseType.toLowerCase()]
        }
      });
    }
  }
  
  return patterns.sort((a, b) => b.confidence - a.confidence);
}

function generateSuggestedTitle(existingTitles: string[], caseType: string): string {
  // Extract common patterns from existing titles
  const commonWords = findCommonWords(existingTitles);
  
  if (commonWords.length > 0) {
    return `${caseType} Case: ${commonWords.slice(0, 2).join(' ')}`;
  }
  
  return `New ${caseType} Case`;
}

function findCommonWords(titles: string[]): string[] {
  const wordFreq: { [key: string]: number } = {};
  
  for (const title of titles) {
    const words = title.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    for (const word of words) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  }
  
  return Object.entries(wordFreq)
    .filter(([word, freq]) => freq >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);
}

async function analyzeUserPatterns(cases: any[], statements: any[]): Promise<any> {
  // Analyze user's case creation patterns
  const patterns = {
    commonCaseTypes: analyzeCommonCaseTypes(cases),
    frequentTerms: analyzeFrequentTerms(cases),
    averageCaseLength: calculateAverageCaseLength(cases),
    timePatterns: analyzeTimePatterns(cases),
    savedStatementPatterns: analyzeSavedStatements(statements)
  };
  
  return patterns;
}

async function generateNewCaseSuggestions(patterns: any, userId: string): Promise<any[]> {
  const suggestions: any[] = [];
  
  // Based on common case types
  for (const caseType of patterns.commonCaseTypes.slice(0, 2)) {
    suggestions.push({
      id: `suggestion-${caseType.type}`,
      type: 'new_case_suggestion',
      title: `Create another ${caseType.type} case`,
      description: `You've been working on ${caseType.type} cases frequently. Consider creating another one.`,
      suggestedTitle: `${caseType.type} Case`,
      confidence: caseType.frequency / 10,
      templateData: {
        caseType: caseType.type,
        tags: [caseType.type.toLowerCase()]
      }
    });
  }
  
  return suggestions;
}

function analyzeCommonCaseTypes(cases: any[]): any[] {
  const typeFreq: { [key: string]: number } = {};
  
  for (const case_ of cases) {
    const data = JSON.parse(case_.data || '{}');
    const caseType = data.caseType || 'General';
    typeFreq[caseType] = (typeFreq[caseType] || 0) + 1;
  }
  
  return Object.entries(typeFreq)
    .map(([type, frequency]) => ({ type, frequency }))
    .sort((a, b) => b.frequency - a.frequency);
}

function analyzeFrequentTerms(cases: any[]): string[] {
  const termFreq: { [key: string]: number } = {};
  
  for (const case_ of cases) {
    const text = (case_.title + ' ' + case_.description).toLowerCase();
    const words = text.replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 4);
    
    for (const word of words) {
      termFreq[word] = (termFreq[word] || 0) + 1;
    }
  }
  
  return Object.entries(termFreq)
    .filter(([word, freq]) => freq >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

function calculateAverageCaseLength(cases: any[]): number {
  if (cases.length === 0) return 0;
  
  const totalLength = cases.reduce((sum, case_) => sum + case_.description.length, 0);
  return Math.round(totalLength / cases.length);
}

function analyzeTimePatterns(cases: any[]): any {
  // Analyze when users typically create cases
  const hourCounts: { [key: number]: number } = {};
  const dayOfWeekCounts: { [key: number]: number } = {};
  
  for (const case_ of cases) {
    const date = new Date(case_.createdAt);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1;
  }
  
  return {
    peakHour: Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0],
    peakDay: Object.entries(dayOfWeekCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
  };
}

function analyzeSavedStatements(statements: any[]): any {
  return {
    totalStatements: statements.length,
    averageLength: statements.length > 0 
      ? Math.round(statements.reduce((sum, s) => sum + s.content.length, 0) / statements.length)
      : 0,
    commonCategories: statements
      .reduce((acc: any, s) => {
        const category = s.category || 'General';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {})
  };
}

function calculateAverageConfidence(relatedCases: any[]): number {
  if (relatedCases.length === 0) return 0;
  return relatedCases.reduce((sum, rc) => sum + rc.similarity, 0) / relatedCases.length;
}
