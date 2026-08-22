
import { AIProvider, Claim, EvidenceContext, ProposalGenerationInput, DeepEvaluationResult } from '@autogig/core';

export class VerificationGate {
  constructor(private ai: AIProvider) {}
  
  // Tier-1 Deterministic Verifier
  deterministicVerify(claim: Claim, evidence: EvidenceContext[]): 'CLEARLY_SUPPORTED' | 'CLEARLY_UNSUPPORTED' | 'AMBIGUOUS' {
    const textLower = claim.text.toLowerCase();
    
    // Simple deterministic heuristics:
    let exactMatch = false;
    for (const ev of evidence) {
      if (ev.relevantSkills?.some(s => textLower.includes(s.toLowerCase()))) exactMatch = true;
      if (ev.extractedFacts?.some(f => textLower.includes(f.toLowerCase()))) exactMatch = true;
    }
    
    // For our Mock test Scenario E, we can treat missing evidence as AMBIGUOUS to let Gemini decide or flag it.
    if (exactMatch) return 'CLEARLY_SUPPORTED';
    
    // For adversarial '10 years' with missing facts, we can make it ambiguous.
    return 'AMBIGUOUS';
  }

  async runVerificationLoop(
    generator: import("./ProposalGenerator").ProposalGenerator,
    opp: import("@autogig/core").CanonicalOpportunity,
    deepResult: DeepEvaluationResult,
    profile: import("@autogig/core").Profile,
    initialDraft: string, 
    evidence: EvidenceContext[], 
    maxRetries: number = 2
  ): Promise<{ status: 'VERIFIED' | 'BLOCKED', text: string, claims: Claim[] }> {
    let currentDraft = initialDraft;
    let blockedClaims: string[] = [];
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const claims = await this.ai.extractClaims(currentDraft);
      
      const ambiguousClaims = [];
      const finalClaims: Claim[] = [];
      
      for (const c of claims) {
         const tier1 = this.deterministicVerify(c, evidence);
         if (tier1 === 'CLEARLY_SUPPORTED') {
            finalClaims.push({ ...c, verificationStatus: 'PASS' });
         } else if (tier1 === 'CLEARLY_UNSUPPORTED') {
            finalClaims.push({ ...c, verificationStatus: 'BLOCK' });
         } else {
            ambiguousClaims.push(c);
         }
      }
      
      if (ambiguousClaims.length > 0) {
         const adjudicated = await this.ai.verifyClaimsBatch(ambiguousClaims, evidence);
         finalClaims.push(...adjudicated);
      }
      
      const newlyBlocked = finalClaims.filter(c => c.verificationStatus === 'BLOCK').map(c => c.text);
      if (newlyBlocked.length === 0) {
         return { status: 'VERIFIED', text: currentDraft, claims: finalClaims };
      }
      
      blockedClaims = newlyBlocked;
      
      // Target rewrite
      if (attempt < maxRetries) {
         currentDraft = await generator.generate(opp, deepResult, evidence, profile, deepResult.recommendedAction as 'RECOMMEND' | 'COUNTER', currentDraft, blockedClaims);
      } else {
         return { status: 'BLOCKED', text: currentDraft, claims: finalClaims };
      }
    }
    
    return { status: 'BLOCKED', text: currentDraft, claims: [] };
  }
}
