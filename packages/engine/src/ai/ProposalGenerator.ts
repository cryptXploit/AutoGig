
import { AIProvider, DeepEvaluationResult, EvidenceContext, ProposalGenerationInput, CanonicalOpportunity, Profile } from '@autogig/core';

export class ProposalGenerator {
  constructor(private ai: AIProvider) {}

  async generate(
    opportunity: CanonicalOpportunity, 
    reasoning: DeepEvaluationResult, 
    evidence: EvidenceContext[], 
    profile: Profile, 
    decision: 'RECOMMEND' | 'COUNTER',
    previousDraft?: string,
    blockedClaims?: string[]
  ): Promise<string> {
    const input: ProposalGenerationInput = {
       opportunity,
       reasoning,
       evidence,
       profile,
       decision,
       previousDraft,
       blockedClaims
    };
    return await this.ai.generateProposal(input);
  }
}
