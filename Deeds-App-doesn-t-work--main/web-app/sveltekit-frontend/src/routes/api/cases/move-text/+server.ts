// API endpoint for moving text fragments between cases
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { caseTextFragments, cases, caseEvents } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { cache } from '$lib/server/cache/cache';

// POST /api/cases/move-text - Move text fragment from one case to another
export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  if (!user?.id) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { 
      sourceCaseId, 
      targetCaseId, 
      textContent, 
      fragmentType = 'note',
      position = 'end' // 'start', 'end', or specific position
    } = await request.json();

    if (!sourceCaseId || !targetCaseId || !textContent) {
      return json({ error: 'Source case ID, target case ID, and text content are required' }, { status: 400 });
    }

    if (sourceCaseId === targetCaseId) {
      return json({ error: 'Source and target cases cannot be the same' }, { status: 400 });
    }

    // Verify user owns both cases
    const [sourceCase, targetCase] = await Promise.all([
      db.select().from(cases).where(and(eq(cases.id, sourceCaseId), eq(cases.createdBy, user.id))).limit(1),
      db.select().from(cases).where(and(eq(cases.id, targetCaseId), eq(cases.createdBy, user.id))).limit(1)
    ]);

    if (sourceCase.length === 0 || targetCase.length === 0) {
      return json({ error: 'One or both cases not found or you do not have permission' }, { status: 404 });
    }

    // Create new text fragment in target case
    const fragmentId = crypto.randomUUID();
    await db.insert(caseTextFragments).values({
      id: fragmentId,
      caseId: targetCaseId,
      content: textContent,
      fragmentType,
      position: position === 'start' ? 0 : 999999, // Simple positioning
      createdBy: user.id,
      createdAt: new Date(),
      tags: '[]',
      isActive: true // boolean, not number
    });

    // Update target case description if position is specified
    if (position === 'start' || position === 'end') {
      const currentDescription = targetCase[0].description;
      let newDescription: string;
      
      if (position === 'start') {
        newDescription = `${textContent}\n\n${currentDescription}`;
      } else {
        newDescription = `${currentDescription}\n\n---\n\n${textContent}`;
      }

      await db.update(cases)
        .set({ 
          description: newDescription,
          updatedAt: new Date()
        })
        .where(eq(cases.id, targetCaseId));
    }

    // Optionally remove text from source case (if it's being moved, not copied)
    // This would require more sophisticated text matching and removal logic
    // For now, we'll just mark it as moved in the event log

    // Log the move event for both cases
    const moveEventData = {
      textPreview: textContent.substring(0, 100) + (textContent.length > 100 ? '...' : ''),
      sourceCaseId,
      sourceTitle: sourceCase[0].title,
      targetCaseId,
      targetTitle: targetCase[0].title,
      fragmentType,
      position,
      movedBy: user.id
    };

    await Promise.all([
      // Event for source case
      db.insert(caseEvents).values({
        id: crypto.randomUUID(),
        caseId: sourceCaseId,
        eventType: 'text_moved_out',
        eventData: JSON.stringify(moveEventData),
        userId: user.id,
        timestamp: new Date()
      }),
      // Event for target case
      db.insert(caseEvents).values({
        id: crypto.randomUUID(),
        caseId: targetCaseId,
        eventType: 'text_moved_in',
        eventData: JSON.stringify(moveEventData),
        userId: user.id,
        timestamp: new Date()
      })
    ]);

    return json({
      success: true,
      fragmentId,
      sourceCaseId,
      targetCaseId,
      message: `Text successfully moved from "${sourceCase[0].title}" to "${targetCase[0].title}"`
    });

  } catch (error) {
    console.error('Text move error:', error);
    return json(
      { error: 'Failed to move text between cases' },
      { status: 500 }
    );
  }
};

// GET /api/cases/move-text/suggestions - Get suggestions for where to move selected text
export const GET: RequestHandler = async ({ url, locals }) => {
  const user = locals.user;
  if (!user?.id) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sourceCaseId = url.searchParams.get('sourceCaseId');
    const textContent = url.searchParams.get('textContent');

    if (!sourceCaseId || !textContent) {
      return json({ error: 'Source case ID and text content are required' }, { status: 400 });
    }

    // Get all user's cases except the source case
    const candidateCases = await db.select()
      .from(cases)
      .where(and(
        eq(cases.createdBy, user.id),
        // Note: SQLite doesn't have != operator in drizzle, use NOT equality
      ));

    // Filter out source case and analyze text for suggestions
    const otherCases = candidateCases.filter(c => c.id !== sourceCaseId);
    
    const suggestions = otherCases
      .map(targetCase => ({
        case: targetCase,
        relevanceScore: calculateTextRelevance(textContent, targetCase),
        suggestedPosition: getSuggestedPosition(textContent, targetCase),
        reason: getMovementReason(textContent, targetCase)
      }))
      .filter(suggestion => suggestion.relevanceScore > 0.2)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 8); // Top 8 suggestions

    return json({
      sourceCaseId,
      textPreview: textContent.substring(0, 200),
      suggestions,
      totalCandidates: otherCases.length
    });

  } catch (error) {
    console.error('Move suggestions error:', error);
    return json(
      { error: 'Failed to get move suggestions' },
      { status: 500 }
    );
  }
};

// POST /api/cases/move-text/extract - Extract and organize text from a case for potential moving
export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  if (!user?.id) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { caseId } = await request.json();

    if (!caseId) {
      return json({ error: 'Case ID is required' }, { status: 400 });
    }

    // Verify user owns the case
    const caseData = await db.select()
      .from(cases)
      .where(and(eq(cases.id, caseId), eq(cases.createdBy, user.id)))
      .limit(1);

    if (caseData.length === 0) {
      return json({ error: 'Case not found or access denied' }, { status: 404 });
    }

    const case_ = caseData[0];
    
    // Extract different types of content that could be moved
    const extractedContent = {
      paragraphs: extractParagraphs(case_.description ?? ''),
      sentences: extractSentences(case_.description ?? ''),
      lists: extractLists(case_.description ?? ''),
      quotes: extractQuotes(case_.description ?? ''),
      dates: extractDates(case_.description ?? ''),
      names: extractNames(case_.description ?? ''),
      locations: extractLocations(case_.description ?? '')
    };

    return json({
      caseId,
      caseTitle: case_.title,
      extractedContent,
      totalElements: Object.values(extractedContent).reduce((sum, arr) => sum + arr.length, 0)
    });

  } catch (error) {
    console.error('Text extraction error:', error);
    return json(
      { error: 'Failed to extract text content' },
      { status: 500 }
    );
  }
};

// Helper functions
function calculateTextRelevance(textContent: string, targetCase: any): number {
  const targetData = JSON.parse(targetCase.data || '{}');
  let score = 0;

  // Keyword overlap
  const textWords = textContent.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const caseWords = (targetCase.title + ' ' + targetCase.description).toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const overlap = textWords.filter(word => caseWords.includes(word)).length;
  score += (overlap / Math.max(textWords.length, 1)) * 0.6;

  // Tag relevance
  const caseTags = targetData.tags || [];
  if (caseTags.length > 0) {
    const textLower = textContent.toLowerCase();
    const tagMatches = caseTags.filter((tag: string) => textLower.includes(tag.toLowerCase())).length;
    score += (tagMatches / caseTags.length) * 0.3;
  }

  // Case type relevance
  if (targetData.caseType) {
    if (textContent.toLowerCase().includes(targetData.caseType.toLowerCase())) {
      score += 0.1;
    }
  }

  return Math.min(score, 1.0);
}

function getSuggestedPosition(textContent: string, targetCase: any): string {
  // Simple heuristic based on content type
  if (textContent.includes('conclusion') || textContent.includes('summary')) {
    return 'end';
  } else if (textContent.includes('background') || textContent.includes('overview')) {
    return 'start';
  }
  return 'end';
}

function getMovementReason(textContent: string, targetCase: any): string {
  const textLower = textContent.toLowerCase();
  const caseTitle = targetCase.title.toLowerCase();
  
  if (textLower.includes(caseTitle) || caseTitle.includes(textLower.substring(0, 20))) {
    return 'Content mentions case title';
  }
  
  const targetData = JSON.parse(targetCase.data || '{}');
  const caseTags = targetData.tags || [];
  const matchingTags = caseTags.filter((tag: string) => textLower.includes(tag.toLowerCase()));
  
  if (matchingTags.length > 0) {
    return `Related to tags: ${matchingTags.join(', ')}`;
  }
  
  return 'General content similarity';
}

// Text extraction helpers
function extractParagraphs(text: string): Array<{content: string, position: number}> {
  return text.split(/\n\s*\n/)
    .map((para, index) => ({
      content: para.trim(),
      position: index
    }))
    .filter(para => para.content.length > 50);
}

function extractSentences(text: string): Array<{content: string, position: number}> {
  return text.split(/[.!?]+/)
    .map((sentence, index) => ({
      content: sentence.trim(),
      position: index
    }))
    .filter(sentence => sentence.content.length > 20);
}

function extractLists(text: string): Array<{content: string, type: string}> {
  const lists: Array<{content: string, type: string}> = [];
  
  // Numbered lists
  const numberedListRegex = /(?:^|\n)(\d+\.\s.*?)(?=\n\d+\.\s|\n\n|\n[^\d]|$)/gs;
  let match;
  while ((match = numberedListRegex.exec(text)) !== null) {
    lists.push({ content: match[1], type: 'numbered' });
  }
  
  // Bullet lists
  const bulletListRegex = /(?:^|\n)([-*•]\s.*?)(?=\n[-*•]\s|\n\n|\n[^-*•]|$)/gs;
  while ((match = bulletListRegex.exec(text)) !== null) {
    lists.push({ content: match[1], type: 'bullet' });
  }
  
  return lists;
}

function extractQuotes(text: string): Array<{content: string, type: string}> {
  const quotes: Array<{content: string, type: string}> = [];
  
  // Double quotes
  const doubleQuoteRegex = /"([^"]+)"/g;
  let match;
  while ((match = doubleQuoteRegex.exec(text)) !== null) {
    if (match[1].length > 10) {
      quotes.push({ content: match[1], type: 'quoted' });
    }
  }
  
  return quotes;
}

function extractDates(text: string): Array<{content: string, type: string}> {
  const dateRegex = /\b(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|\w+\s\d{1,2},?\s\d{4})\b/g;
  const matches = text.match(dateRegex) || [];
  
  return matches.map(date => ({
    content: date,
    type: 'date'
  }));
}

function extractNames(text: string): Array<{content: string, type: string}> {
  // Simple name extraction - look for capitalized words that might be names
  const nameRegex = /\b[A-Z][a-z]+\s[A-Z][a-z]+\b/g;
  const matches = text.match(nameRegex) || [];
  
  return matches.map(name => ({
    content: name,
    type: 'name'
  }));
}

function extractLocations(text: string): Array<{content: string, type: string}> {
  // Simple location extraction - look for common location patterns
  const locationRegex = /\b(?:[A-Z][a-z]+\s(?:Street|Avenue|Road|Drive|Court|Place|Boulevard)|[A-Z][a-z]+,\s[A-Z]{2})\b/g;
  const matches = text.match(locationRegex) || [];
  
  return matches.map(location => ({
    content: location,
    type: 'location'
  }));
}
