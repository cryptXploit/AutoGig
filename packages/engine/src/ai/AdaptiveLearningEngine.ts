import { OutcomeRecord, CanonicalOpportunity, DeepEvaluationResult, HistoricalIntelligence, ScoreBreakdown } from '@autogig/core';

export class AdaptiveLearningEngine {
  constructor() {}

  public evaluateHistory(
    opportunity: CanonicalOpportunity,
    baseScore: ScoreBreakdown,
    historicalOutcomes: { outcome: OutcomeRecord, opportunity: CanonicalOpportunity, originalEvaluation: DeepEvaluationResult }[]
  ): ScoreBreakdown {
    
    let similarCount = 0;
    let successCount = 0;
    let failureCount = 0;
    let recentTimeDecayFactor = 0;

    const now = new Date().getTime();

    // Deterministic Similarity Matching
    for (const record of historicalOutcomes) {
      let similarityScore = 0;
      
      // Feature 1: Budget Bucket (within 20%)
      const baseBudget = opportunity.normalizedBudget || 0;
      const histBudget = record.opportunity.normalizedBudget || 0;
      if (baseBudget > 0 && histBudget > 0) {
        if (Math.abs(baseBudget - histBudget) / baseBudget <= 0.20) {
           similarityScore += 2;
        }
      }

      // Feature 2: Client Risk Class match (we just assume baseScore isn't tracking it directly here, we could match on route)
      if (String(baseScore.route).includes('REASON') && record.originalEvaluation.recommendedAction === 'RECOMMEND') {
        similarityScore += 2; // Rough mapping
      }

      // Feature 3: Skills Overlap
      const baseTitle = opportunity.title.toLowerCase();
      const histTitle = record.opportunity.title.toLowerCase();
      
      const keywords = ['react', 'node', 'typescript', 'sql', 'aws', 'python'];
      let matchCount = 0;
      for (const kw of keywords) {
        if (baseTitle.includes(kw) && histTitle.includes(kw)) matchCount++;
      }
      if (matchCount > 0) similarityScore += matchCount;

      if (similarityScore >= 3) {
         similarCount++;
         
         const daysOld = (now - record.outcome.createdAt.getTime()) / (1000 * 60 * 60 * 24);
         let weight = 1.0;
         if (daysOld > 90) weight = 0.1;
         else if (daysOld > 30) weight = 0.5;

         recentTimeDecayFactor += weight;

         if (record.outcome.status === 'WON' || record.outcome.status === 'CLIENT_REPLIED' || record.outcome.status === 'PAYMENT_SUCCESS' || record.outcome.clientFeedback === 'POSITIVE_FEEDBACK') {
           successCount += weight;
         } else if (record.outcome.status === 'LOST' || record.outcome.status === 'NO_RESPONSE' || record.outcome.status === 'PAYMENT_FAILED' || record.outcome.clientFeedback === 'NEGATIVE_FEEDBACK') {
           failureCount += weight;
         }
      }
    }

    let adjustment = 0;
    let explanation = "No relevant historical outcomes found. Neutral adjustment.";

    if (similarCount > 0) {
       const netSuccess = successCount - failureCount;
       adjustment = Math.max(-10, Math.min(10, netSuccess * 2));
       explanation = `AutoGig found ${similarCount} similar historical opportunities. Based on historical win/loss ratios, confidence was adjusted by ${adjustment > 0 ? '+' : ''}${Math.round(adjustment)}.`;
    }

    const historicalIntelligence: HistoricalIntelligence = {
      historicalSuccessAdjustment: Math.round(adjustment),
      historicalConfidence: similarCount > 0 ? Math.min(100, similarCount * 10) : 0,
      patternConfidence: similarCount > 5 ? 80 : (similarCount > 0 ? 40 : 0),
      recommendationConfidence: 90,
      successRate: similarCount > 0 ? (successCount / (successCount + failureCount || 1)) : 0,
      similarOutcomeCount: similarCount,
      explanation
    };

    let finalScore = Math.max(0, Math.min(100, baseScore.overall + historicalIntelligence.historicalSuccessAdjustment));

    // Hard rejection rules remain absolute
    if (baseScore.route === 'REJECT') {
       finalScore = baseScore.overall; // Override to preserve original bounds logically
       historicalIntelligence.explanation += " Hard rejection rules override positive historical intelligence.";
       historicalIntelligence.historicalSuccessAdjustment = 0;
    }

    return {
      ...baseScore,
      historicalIntelligence,
      finalScore
    };
  }
}