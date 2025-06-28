import Loki from 'lokijs';
import type { LegacyCitationPoint } from '$lib/data/types';

// In-memory Loki.js database for fast Citation Point operations
class CitationStore {
  private db: Loki;
  private citations: Collection<LegacyCitationPoint>;
  private initialized = false;

  constructor() {
    this.db = new Loki('citations.db', {
      adapter: new Loki.LokiMemoryAdapter(),
      autoload: false,
      autosave: false
    });
    this.citations = this.db.addCollection('citations', {
      indices: ['id', 'source', 'labels', 'linkedTo'],
      unique: ['id']
    });
  }

  async initialize() {
    if (this.initialized) return;
    
    // Load mock data for development
    await this.loadMockData();
    this.initialized = true;
  }

  private async loadMockData() {
    const mockCitations: LegacyCitationPoint[] = [
      {
        id: 'cit_001',
        summary: 'Defendant showed suspicious behavior at 2:30 AM near the crime scene, captured on surveillance footage',
        source: 'evidence/video_001',
        labels: ['surveillance', 'behavior', 'timeline'],
        vector: [0.1, 0.5, 0.8, 0.3, 0.9],
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 86400000
      },
      {
        id: 'cit_002',
        summary: 'Fingerprint analysis confirms match with database records from previous misdemeanor',
        source: 'evidence/forensics_001',
        labels: ['fingerprints', 'forensics', 'identity'],
        vector: [0.8, 0.2, 0.4, 0.7, 0.1],
        createdAt: Date.now() - 72000000,
        updatedAt: Date.now() - 72000000
      },
      {
        id: 'cit_003',
        summary: 'Witness testimony places suspect at location 15 minutes before incident occurred',
        source: 'evidence/witness_001',
        labels: ['witness', 'timeline', 'location'],
        vector: [0.3, 0.9, 0.1, 0.6, 0.4],
        createdAt: Date.now() - 58000000,
        updatedAt: Date.now() - 58000000
      },
      {
        id: 'cit_004',
        summary: 'Phone records show contact with known associates during critical time window',
        source: 'evidence/phone_001',
        labels: ['phone records', 'associates', 'communication'],
        vector: [0.6, 0.1, 0.7, 0.2, 0.8],
        createdAt: Date.now() - 44000000,
        updatedAt: Date.now() - 44000000,
        linkedTo: 'case_001'
      },
      {
        id: 'cit_005',
        summary: 'DNA evidence found at scene provides 99.9% statistical match with defendant',
        source: 'evidence/dna_001',
        labels: ['DNA', 'forensics', 'statistical analysis'],
        vector: [0.9, 0.8, 0.3, 0.1, 0.5],
        createdAt: Date.now() - 30000000,
        updatedAt: Date.now() - 30000000
      }
    ];

    mockCitations.forEach(citation => {
      this.citations.insert(citation);
    });
  }

  // Search citations with fuzzy matching and semantic ranking
  searchCitations(query: string, limit = 10): LegacyCitationPoint[] {
    if (!query.trim()) {
      return this.citations.chain()
        .simplesort('updatedAt', true)
        .limit(limit)
        .data();
    }

    const queryLower = query.toLowerCase();
    
    // Fuzzy search across summary and labels
    const results = this.citations.chain()
      .where((obj: LegacyCitationPoint) => {
        const summaryMatch = obj.summary.toLowerCase().includes(queryLower);
        const labelMatch = obj.labels.some((label: string) => 
          label.toLowerCase().includes(queryLower)
        );
        const sourceMatch = obj.source.toLowerCase().includes(queryLower);
        
        return summaryMatch || labelMatch || sourceMatch;
      })
      .simplesort('updatedAt', true)
      .limit(limit)
      .data();

    return results;
  }

  // Get all citations linked to a specific case
  getCitationsByCase(caseId: string): LegacyCitationPoint[] {
    return this.citations.find({ linkedTo: caseId });
  }

  // Get unlinked citations (available to add to cases)
  getUnlinkedCitations(limit = 20): LegacyCitationPoint[] {
    return this.citations.chain()
      .where((obj: LegacyCitationPoint) => !obj.linkedTo)
      .simplesort('updatedAt', true)
      .limit(limit)
      .data();
  }

  // Add new citation point
  addCitation(citation: Omit<LegacyCitationPoint, 'id' | 'createdAt' | 'updatedAt'>): LegacyCitationPoint {
    const newCitation: LegacyCitationPoint = {
      ...citation,
      id: `cit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.citations.insert(newCitation);
    return newCitation;
  }

  // Link citations to a case
  linkCitationsToCase(citationIds: string[], caseId: string): boolean {
    try {
      citationIds.forEach(citationId => {
        const citation = this.citations.findOne({ id: citationId });
        if (citation) {
          citation.linkedTo = caseId;
          citation.updatedAt = Date.now();
          this.citations.update(citation);
        }
      });
      return true;
    } catch (error) {
      console.error('Error linking citations to case:', error);
      return false;
    }
  }

  // Remove citation link from case
  unlinkCitationFromCase(citationId: string): boolean {
    try {
      const citation = this.citations.findOne({ id: citationId });
      if (citation) {
        delete citation.linkedTo;
        citation.updatedAt = Date.now();
        this.citations.update(citation);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error unlinking citation from case:', error);
      return false;
    }
  }

  // Get citation by ID
  getCitation(id: string): LegacyCitationPoint | null {
    return this.citations.findOne({ id });
  }

  // Update citation
  updateCitation(id: string, updates: Partial<LegacyCitationPoint>): boolean {
    try {
      const citation = this.citations.findOne({ id });
      if (citation) {
        Object.assign(citation, updates, { updatedAt: Date.now() });
        this.citations.update(citation);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating citation:', error);
      return false;
    }
  }

  // Delete citation
  deleteCitation(id: string): boolean {
    try {
      const citation = this.citations.findOne({ id });
      if (citation) {
        this.citations.remove(citation);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting citation:', error);
      return false;
    }
  }

  // Get statistics
  getStats() {
    const total = this.citations.count();
    const linked = this.citations.count({ linkedTo: { '$ne': null } });
    const unlinked = total - linked;
    
    return {
      total,
      linked,
      unlinked,
      labels: this.getUniqueLabels()
    };
  }

  private getUniqueLabels(): string[] {
    const allLabels = this.citations.chain()
      .mapReduce(
        (obj: LegacyCitationPoint) => obj.labels,
        (array: string[][]) => array.flat()
      );
    
    return [...new Set(allLabels)].sort();
  }
}

// Singleton instance
export const citationStore = new CitationStore();
