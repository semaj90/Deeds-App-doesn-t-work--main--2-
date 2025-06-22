import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { content, caseId } = await request.json();

    if (!content || !content.trim()) {
      return json(
        { error: 'Missing required field: content' },
        { status: 400 }
      );
    }

    // Call the Python NLP service for auto-tagging
    const nlpServiceUrl = env.LLM_SERVICE_URL || 'http://localhost:8000';
    
    // First, generate embedding for the content
    const embeddingResponse = await fetch(`${nlpServiceUrl}/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: content })
    });

    if (!embeddingResponse.ok) {
      throw new Error(`Embedding service error: ${embeddingResponse.status}`);
    }

    const embeddingResult = await embeddingResponse.json();
    const embedding = embeddingResult.embedding;

    // Search Qdrant for similar content and tags
    const qdrantUrl = env.QDRANT_URL || 'http://localhost:6333';
    const searchResponse = await fetch(`${qdrantUrl}/collections/legal_tags/points/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vector: embedding,
        limit: 10,
        score_threshold: 0.7
      })
    });

    let suggestedTags: string[] = [];
    
    if (searchResponse.ok) {
      const searchResult = await searchResponse.json();
      suggestedTags = searchResult.result?.map((item: any) => item.payload?.tag).filter(Boolean) || [];
    }

    // Fallback: Extract basic tags using simple NLP
    if (suggestedTags.length === 0) {
      suggestedTags = extractBasicTags(content);
    }

    // Call NLP service for entity extraction (optional enhancement)
    let entities: any[] = [];
    try {
      const entityResponse = await fetch(`${nlpServiceUrl}/extract-entities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content })
      });

      if (entityResponse.ok) {
        const entityResult = await entityResponse.json();
        entities = entityResult.entities || [];
      }
    } catch (error) {
      console.warn('Entity extraction failed:', error);
    }

    return json({
      success: true,
      tags: suggestedTags,
      entities,
      metadata: {
        contentLength: content.length,
        embeddingDimensions: embedding?.length || 0,
        similarityMatches: suggestedTags.length,
        caseId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Auto-tagging error:', error);
    
    // Fallback: Basic rule-based tagging
    const { content } = await request.json();
    const fallbackTags = extractBasicTags(content);

    return json({
      success: true,
      tags: fallbackTags,
      fallback: true,
      metadata: {
        contentLength: content.length,
        timestamp: new Date().toISOString()
      }
    });
  }
};

function extractBasicTags(content: string): string[] {
  const text = content.toLowerCase();
  const tags: string[] = [];

  // Legal document type detection
  const documentTypes = {
    'contract': ['contract', 'agreement', 'terms', 'conditions'],
    'evidence': ['evidence', 'exhibit', 'proof', 'documentation'],
    'testimony': ['testimony', 'witness', 'statement', 'deposition'],
    'court_order': ['order', 'decree', 'judgment', 'ruling'],
    'pleading': ['complaint', 'answer', 'motion', 'brief'],
    'correspondence': ['letter', 'email', 'memo', 'communication']
  };

  // Legal concepts
  const legalConcepts = {
    'criminal': ['criminal', 'felony', 'misdemeanor', 'crime', 'violation'],
    'civil': ['civil', 'tort', 'damages', 'liability', 'negligence'],
    'property': ['property', 'real estate', 'land', 'ownership', 'title'],
    'family': ['family', 'divorce', 'custody', 'marriage', 'adoption'],
    'corporate': ['corporate', 'business', 'company', 'partnership', 'llc'],
    'intellectual_property': ['patent', 'trademark', 'copyright', 'trade secret']
  };

  // People and entities
  const entityTypes = {
    'plaintiff': ['plaintiff', 'complainant', 'petitioner'],
    'defendant': ['defendant', 'respondent', 'accused'],
    'attorney': ['attorney', 'lawyer', 'counsel', 'advocate'],
    'judge': ['judge', 'justice', 'magistrate', 'court'],
    'witness': ['witness', 'deponent', 'observer']
  };

  // Check for matches
  const allCategories = { ...documentTypes, ...legalConcepts, ...entityTypes };
  
  for (const [tag, keywords] of Object.entries(allCategories)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      tags.push(tag);
    }
  }

  // Extract dates
  const datePattern = /\b(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|[A-Za-z]+ \d{1,2}, \d{4})\b/g;
  if (datePattern.test(text)) {
    tags.push('dated_document');
  }

  // Extract monetary amounts
  const moneyPattern = /\$[\d,]+(\.\d{2})?/g;
  if (moneyPattern.test(text)) {
    tags.push('financial');
  }

  return [...new Set(tags)]; // Remove duplicates
}
