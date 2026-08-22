
import { AIProvider, DeepReasoningInput, DeepEvaluationResult, EvidenceContext, CanonicalOpportunity, EvaluationRecord, Profile, Preference } from '@autogig/core';

export class DeepReasoner {
  constructor(private ai: AIProvider) {}

  async evaluate(
    opportunity: CanonicalOpportunity, 
    evaluation: EvaluationRecord, 
    evidence: EvidenceContext[], 
    profile: Profile, 
    preferences: Preference
  ): Promise<DeepEvaluationResult> {
    const input: DeepReasoningInput = {
       opportunity,
       evaluation,
       evidence,
       profile,
       preferences
    };
    return await this.ai.deepReasoning(input);
  }
}
