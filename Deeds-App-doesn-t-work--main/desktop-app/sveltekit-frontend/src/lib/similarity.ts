export function cosineSimilarity(a: number[], b: number[]) {
  if (a.length !== b.length) return 0;
  const dot = a.reduce((acc, ai, i) => acc + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((acc, ai) => acc + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((acc, bi) => acc + bi * bi, 0));
  return dot / (normA * normB);
}
