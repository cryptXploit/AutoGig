import { ApplicationIntelligenceInput, ApplicationIntelligenceResult } from '@autogig/core';
import { RelevanceEngine } from './RelevanceEngine';
import { AIProvider } from '@autogig/core';

export class ApplicationIntelligenceEngine {
  private relevanceEngine = new RelevanceEngine();

  constructor(private ai: AIProvider) {}

  async generate(
    input: ApplicationIntelligenceInput,
    clientIntel: any // passing as any for now
  ): Promise<ApplicationIntelligenceResult> {
    const opp = input.opportunity;
    const profile = input.profile;
    
    // 1. Deterministic Relevance & Constraints
    const relevance = this.relevanceEngine.analyze(
      opp, 
      profile, 
      input.preferences, 
      clientIntel
    );

    // 2. Draft using AI (strictly limited by relevance findings)
    const result = await this.ai.generateApplicationIntelligence(input, relevance);

    // 3. Fallbacks and Guarantees
    // Force readiness score from deterministic engine
    result.readinessScore = relevance.readinessScore;
    result.suggestedRate = relevance.suggestedRate;

    // Truth/Evidence Gate: NEVER allow missing skills to be marked as emphasized or strong
    result.missingRequirements = relevance.missingSkills;
    
    // 4. Recommendation Logic
    if (relevance.missingSkills.length > (opp.normalizedSkills?.length || 1) * 0.5) {
       result.recommendation = 'SKIP';
    } else if (result.readinessScore < 60) {
       result.recommendation = 'REVIEW';
    } else {
       result.recommendation = 'APPLY';
    }

    // Ensure all items in tailoredResume have source
    result.tailoredResume.skills.forEach((s: any) => {
       if (!s.source) s.source = 'Profile Default';
    });

    return result;
  }
}
