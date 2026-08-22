import { CanonicalOpportunity, Profile, EvidenceContext } from '@autogig/core';

export class LocalSimilarityRetriever {
  computeTechnicalFit(opp: CanonicalOpportunity, profile: Profile): number {
    return this.jaccardSimilarity(opp.normalizedSkills, profile.skills) * 100;
  }

  rankEvidence(opp: CanonicalOpportunity, evidence: EvidenceContext[]): EvidenceContext[] {
    const oppTokens = this.tokenize(opp.description + ' ' + opp.normalizedSkills.join(' '));
    if (oppTokens.size === 0) return evidence.map(e => ({...e, confidence: 0}));

    const ranked = evidence.map(e => {
       const evTokens = this.tokenize((e.extractedFacts || []).join(' ') + ' ' + (e.relevantSkills || []).join(' '));
       const score = this.jaccardSimilaritySet(oppTokens, evTokens);
       return { ...e, confidence: score };
    });
    return ranked.sort((a, b) => b.confidence - a.confidence);
  }

  private tokenize(text: string): Set<string> {
    return new Set((text || '').toLowerCase().match(/\w+/g) || []);
  }

  private jaccardSimilaritySet(setA: Set<string>, setB: Set<string>): number {
    if (setA.size === 0 && setB.size === 0) return 0;
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
  }

  private jaccardSimilarity(arr1: string[], arr2: string[]): number {
    return this.jaccardSimilaritySet(new Set(arr1.map(s => s.toLowerCase())), new Set(arr2.map(s => s.toLowerCase())));
  }
}
