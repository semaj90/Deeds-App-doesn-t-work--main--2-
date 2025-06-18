// NLP-powered case analysis and auto-population
export interface CaseAnalysis {
  extractedEntities: {
    persons: string[];
    locations: string[];
    organizations: string[];
    dates: string[];
    crimes: string[];
  };
  suggestedTitle: string;
  estimatedDangerScore: number;
  keyPhrases: string[];
  confidence: number;
}

export interface CriminalRecord {
  id: string;
  firstName: string;
  lastName: string;
  aliases: string[];
  threatLevel: string;
  lastKnownAddress?: string;
}

export class CaseNLPParser {
  private crimeKeywords = [
    'assault', 'battery', 'theft', 'robbery', 'burglary', 'murder', 'homicide',
    'kidnapping', 'fraud', 'embezzlement', 'drugs', 'trafficking', 'weapon',
    'domestic violence', 'sexual assault', 'arson', 'vandalism', 'cybercrime'
  ];

  private dangerKeywords = [
    'weapon', 'violence', 'threat', 'assault', 'murder', 'homicide', 'armed',
    'dangerous', 'repeat', 'gang', 'organized', 'trafficking', 'explosive'
  ];

  async analyzeCaseDescription(description: string): Promise<CaseAnalysis> {
    const words = description.toLowerCase().split(/\s+/);
    
    // Extract entities using pattern matching
    const entities = this.extractEntities(description);
    
    // Generate suggested title
    const suggestedTitle = this.generateTitle(description, entities);
    
    // Calculate danger score
    const estimatedDangerScore = this.calculateDangerScore(description);
    
    // Extract key phrases
    const keyPhrases = this.extractKeyPhrases(description);
    
    return {
      extractedEntities: entities,
      suggestedTitle,
      estimatedDangerScore,
      keyPhrases,
      confidence: 0.85 // Simulated confidence score
    };
  }

  private extractEntities(text: string) {
    const entities = {
      persons: this.extractPersons(text),
      locations: this.extractLocations(text),
      organizations: this.extractOrganizations(text),
      dates: this.extractDates(text),
      crimes: this.extractCrimes(text)
    };
    
    return entities;
  }

  private extractPersons(text: string): string[] {
    // Simple pattern matching for names (Title Case words)
    const namePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
    const matches = text.match(namePattern) || [];
    return [...new Set(matches)]; // Remove duplicates
  }

  private extractLocations(text: string): string[] {
    // Common location patterns
    const locationPattern = /\b(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd|Way|Lane|Ln)\b/gi;
    const addressPattern = /\d+\s+[A-Za-z\s]+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr)/gi;
    
    const locations = [];
    const matches = text.match(addressPattern) || [];
    locations.push(...matches);
    
    return [...new Set(locations)];
  }

  private extractOrganizations(text: string): string[] {
    // Common organization patterns
    const orgPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Corp|Corporation|Inc|LLC|Company|Co|Bank|Hospital|School|University)\b/g;
    const matches = text.match(orgPattern) || [];
    return [...new Set(matches)];
  }

  private extractDates(text: string): string[] {
    // Date patterns
    const datePatterns = [
      /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, // MM/DD/YYYY
      /\b\d{1,2}-\d{1,2}-\d{2,4}\b/g,   // MM-DD-YYYY
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
      /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi
    ];
    
    const dates = [];
    for (const pattern of datePatterns) {
      const matches = text.match(pattern) || [];
      dates.push(...matches);
    }
    
    return [...new Set(dates)];
  }

  private extractCrimes(text: string): string[] {
    const foundCrimes = [];
    const lowerText = text.toLowerCase();
    
    for (const crime of this.crimeKeywords) {
      if (lowerText.includes(crime)) {
        foundCrimes.push(crime);
      }
    }
    
    return foundCrimes;
  }

  private generateTitle(description: string, entities: any): string {
    const crimes = entities.crimes;
    const persons = entities.persons;
    
    if (crimes.length > 0 && persons.length > 0) {
      return `${crimes[0].charAt(0).toUpperCase() + crimes[0].slice(1)} case involving ${persons[0]}`;
    } else if (crimes.length > 0) {
      return `${crimes[0].charAt(0).toUpperCase() + crimes[0].slice(1)} investigation`;
    } else if (persons.length > 0) {
      return `Investigation involving ${persons[0]}`;
    } else {
      return 'New criminal case';
    }
  }

  private calculateDangerScore(description: string): number {
    const lowerText = description.toLowerCase();
    let score = 1; // Base score
    
    // Check for danger keywords
    for (const keyword of this.dangerKeywords) {
      if (lowerText.includes(keyword)) {
        score += 1.5;
      }
    }
    
    // Check for multiple victims/perpetrators
    if (lowerText.includes('multiple') || lowerText.includes('several')) {
      score += 1;
    }
    
    // Check for prior offenses
    if (lowerText.includes('repeat') || lowerText.includes('previous') || lowerText.includes('history')) {
      score += 1;
    }
    
    return Math.min(Math.round(score), 10);
  }

  private extractKeyPhrases(description: string): string[] {
    // Simple keyword extraction
    const words = description.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'was', 'were', 'been', 'be', 'have', 'has', 'had']);
    
    const filteredWords = words.filter(word => 
      word.length > 3 && 
      !stopWords.has(word) && 
      /^[a-zA-Z]+$/.test(word)
    );
      // Count word frequency
    const wordCount: Record<string, number> = {};
    for (const word of filteredWords) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
    
    // Sort by frequency and return top phrases
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([word]) => word);
  }

  async searchSimilarCriminals(entities: any): Promise<CriminalRecord[]> {
    // This would integrate with the database to find similar criminals
    // For now, return mock data based on extracted names
    const mockCriminals: CriminalRecord[] = [];
    
    for (const person of entities.persons.slice(0, 3)) {
      const [firstName, lastName] = person.split(' ');
      mockCriminals.push({
        id: `criminal-${Math.random().toString(36).substr(2, 9)}`,
        firstName,
        lastName,
        aliases: [`${firstName.charAt(0)}. ${lastName}`, `${firstName} ${lastName.charAt(0)}.`],
        threatLevel: Math.random() > 0.5 ? 'high' : 'medium',
        lastKnownAddress: '123 Unknown St, City, State'
      });
    }
    
    return mockCriminals;
  }
}

export const caseNLPParser = new CaseNLPParser();
