// import Fuse from 'fuse.js'; // TODO: Install fuse.js
import type { CitationPoint } from './data/types';
import { cosineSimilarity } from './similarity';

// Simple fuzzy search implementation until fuse.js is installed
function simpleFuzzySearch(items: CitationPoint[], query: string) {
  const lowercaseQuery = query.toLowerCase();
  return items.map(item => {
    const summaryMatch = item.summary.toLowerCase().includes(lowercaseQuery);
    const labelsMatch = item.labels.some(label => label.toLowerCase().includes(lowercaseQuery));
    const sourceMatch = item.source.toLowerCase().includes(lowercaseQuery);
    
    const score = (summaryMatch ? 0.5 : 0) + (labelsMatch ? 0.3 : 0) + (sourceMatch ? 0.2 : 0);
    return { item, score };
  }).filter(result => result.score > 0);
}

// Mock LokiJS database - replace with actual implementation
let citationPointsData: CitationPoint[] = [];

export async function hybridCitationSearch(query: string, embedding?: number[]) {
  const items: CitationPoint[] = citationPointsData;

  const fuzzyResults = simpleFuzzySearch(items, query);

  const semanticResults = embedding
    ? items.map(item => ({
        ...item,
        semanticScore: cosineSimilarity(item.vector ?? [], embedding),
      }))
    : [];

  // Combine results
  return items.map(item => {
    const fuzzy = fuzzyResults.find((r: { item: CitationPoint; score: number }) => r.item.id === item.id);
    const semantic = semanticResults.find(r => r.id === item.id);

    const finalScore =
      (fuzzy?.score ?? 0) * 0.6 + (semantic?.semanticScore ?? 0) * 0.4;

    return { ...item, finalScore };
  }).sort((a, b) => b.finalScore - a.finalScore);
}

export function forwardCitationPoint(pointId: string, newCaseId: string) {
  const point = citationPointsData.find(p => p.id === pointId);
  if (!point) return;

  const clone: CitationPoint = { 
    ...point, 
    id: crypto.randomUUID(), 
    source: `linked-from:${point.source}`, 
    linkedTo: newCaseId,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  citationPointsData.push(clone);
  return clone;
}

export function addCitationPoint(point: CitationPoint) {
  citationPointsData.push(point);
}

export function getCitationPoints() {
  return citationPointsData;
}

export function getCitationPointsByCase(caseId: string) {
  return citationPointsData.filter(p => p.linkedTo === caseId);
}
