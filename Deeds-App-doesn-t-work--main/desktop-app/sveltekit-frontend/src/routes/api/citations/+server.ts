import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { citationStore } from '$lib/citations/lokiStore';

// Initialize the citation store
let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await citationStore.initialize();
    initialized = true;
  }
}

export const GET: RequestHandler = async ({ url }: { url: URL }) => {
  try {
    await ensureInitialized();
    
    const searchQuery = url.searchParams.get('q') || '';
    const caseId = url.searchParams.get('caseId');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const filter = url.searchParams.get('filter') as 'all' | 'linked' | 'unlinked' || 'all';

    let citations;

    if (caseId) {
      // Get citations for a specific case
      citations = citationStore.getCitationsByCase(caseId);
    } else if (searchQuery) {
      // Search citations
      citations = citationStore.searchCitations(searchQuery, limit);
    } else {
      // Get citations by filter
      switch (filter) {
        case 'linked':
          citations = citationStore.searchCitations('').filter(c => c.linkedTo);
          break;
        case 'unlinked':
          citations = citationStore.getUnlinkedCitations(limit);
          break;
        default:
          citations = citationStore.searchCitations('', limit);
      }
    }

    return json({
      success: true,
      citations,
      stats: citationStore.getStats()
    });
  } catch (error) {
    console.error('Failed to get citations:', error);
    return json(
      { 
        success: false, 
        error: 'Failed to fetch citations',
        citations: [],
        stats: { total: 0, linked: 0, unlinked: 0, labels: [] }
      },
      { status: 500 }
    );
  }
};

export const POST: RequestHandler = async ({ request }: { request: Request }) => {
  try {
    await ensureInitialized();
    
    const data = await request.json();
    const { action, ...payload } = data;

    switch (action) {
      case 'create': {
        const { summary, source, labels, linkedTo } = payload;
        
        if (!summary || !source) {
          return json(
            { success: false, error: 'Summary and source are required' },
            { status: 400 }
          );
        }

        const citation = citationStore.addCitation({
          summary: summary.trim(),
          source: source.trim(),
          labels: Array.isArray(labels) ? labels : [],
          linkedTo
        });

        return json({
          success: true,
          citation,
          message: 'Citation created successfully'
        });
      }

      case 'link': {
        const { citationIds, caseId } = payload;
        
        if (!Array.isArray(citationIds) || !caseId) {
          return json(
            { success: false, error: 'Citation IDs and case ID are required' },
            { status: 400 }
          );
        }

        const success = citationStore.linkCitationsToCase(citationIds, caseId);
        
        if (success) {
          return json({
            success: true,
            message: `${citationIds.length} citation(s) linked to case ${caseId}`
          });
        } else {
          return json(
            { success: false, error: 'Failed to link citations to case' },
            { status: 500 }
          );
        }
      }

      case 'unlink': {
        const { citationId } = payload;
        
        if (!citationId) {
          return json(
            { success: false, error: 'Citation ID is required' },
            { status: 400 }
          );
        }

        const success = citationStore.unlinkCitationFromCase(citationId);
        
        if (success) {
          return json({
            success: true,
            message: 'Citation unlinked from case'
          });
        } else {
          return json(
            { success: false, error: 'Failed to unlink citation from case' },
            { status: 500 }
          );
        }
      }

      case 'summarize': {
        // Mock AI summarization endpoint
        const { sourceData, sourceType } = payload;
        
        if (!sourceData) {
          return json(
            { success: false, error: 'Source data is required for summarization' },
            { status: 400 }
          );
        }

        // Mock AI processing - in reality, this would call your AI service
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
        
        const mockSummaries = {
          'video': 'Surveillance footage analysis reveals suspicious behavior patterns during critical time window',
          'document': 'Document analysis indicates discrepancies in stated timeline and witness accounts',
          'audio': 'Audio recording contains clear evidence of premeditation and intent',
          'image': 'Photographic evidence shows clear identification markers and contextual details',
          'forensic': 'Forensic analysis provides definitive evidence linking suspect to crime scene'
        };

        const summary = mockSummaries[sourceType as keyof typeof mockSummaries] || 
                        'AI analysis reveals significant evidentiary value with high confidence rating';

        const labels = {
          'video': ['surveillance', 'behavioral analysis', 'timeline'],
          'document': ['documentation', 'timeline', 'witness testimony'],
          'audio': ['recording', 'intent', 'premeditation'],
          'image': ['photography', 'identification', 'physical evidence'],
          'forensic': ['forensics', 'DNA', 'scientific analysis']
        };

        return json({
          success: true,
          summary,
          suggestedLabels: labels[sourceType as keyof typeof labels] || ['evidence', 'analysis'],
          confidence: 0.85 + Math.random() * 0.15 // Mock confidence score
        });
      }

      default:
        return json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Failed to process citation request:', error);
    return json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
};

export const PUT: RequestHandler = async ({ request, params }: { request: Request; params: any }) => {
  try {
    await ensureInitialized();
    
    const citationId = params.id;
    const updates = await request.json();

    if (!citationId) {
      return json(
        { success: false, error: 'Citation ID is required' },
        { status: 400 }
      );
    }

    const success = citationStore.updateCitation(citationId, updates);
    
    if (success) {
      const citation = citationStore.getCitation(citationId);
      return json({
        success: true,
        citation,
        message: 'Citation updated successfully'
      });
    } else {
      return json(
        { success: false, error: 'Citation not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Failed to update citation:', error);
    return json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
};

export const DELETE: RequestHandler = async ({ params }: { params: any }) => {
  try {
    await ensureInitialized();
    
    const citationId = params.id;

    if (!citationId) {
      return json(
        { success: false, error: 'Citation ID is required' },
        { status: 400 }
      );
    }

    const success = citationStore.deleteCitation(citationId);
    
    if (success) {
      return json({
        success: true,
        message: 'Citation deleted successfully'
      });
    } else {
      return json(
        { success: false, error: 'Citation not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Failed to delete citation:', error);
    return json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
};
