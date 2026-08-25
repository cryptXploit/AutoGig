import { OutcomeRecord, CanonicalOpportunity, DeepEvaluationResult, HistoricalIntelligence, ScoreBreakdown, EvaluationRecord } from '@autogig/core';

export class AdaptiveLearningEngine {
  constructor() {}

  public evaluateHistory(
    opportunity: CanonicalOpportunity,
    baseEvaluation: EvaluationRecord,
    historicalOutcomes: { outcome: OutcomeRecord, opportunity: CanonicalOpportunity, originalEvaluation: EvaluationRecord }[]
  ): EvaluationRecord {
    
    let similarCount = 0;
    let successCount = 0;
    let failureCount = 0;
    let recentTimeDecayFactor = 0;

    const now = new Date().getTime();

    // Deterministic Similarity Matching
    for (const record of historicalOutcomes) {
      if (record.opportunity.id === opportunity.id) continue;

      let similarityScore = 0;
      let totalPossible = 0;
      
      // Feature 1: Budget Bucket (within 20%)
      const baseBudget = opportunity.normalizedBudget || 0;
      const histBudget = record.opportunity.normalizedBudget || 0;
      if (baseBudget > 0 && histBudget > 0) {
        totalPossible += 2;
        if (Math.abs(baseBudget - histBudget) / baseBudget <= 0.20) {
           similarityScore += 2;
        }
      }

      // Feature 2: Client Risk Class match
      if ((baseEvaluation as any).clientRiskAssessment && (record.originalEvaluation as any).clientRiskAssessment) {
        totalPossible += 2;
        if ((baseEvaluation as any).clientRiskAssessment === (record.originalEvaluation as any).clientRiskAssessment) {
          similarityScore += 2;
        }
      }

      // Feature 3: Skills Overlap
      const baseSkills = opportunity.normalizedSkills || [];
      const histSkills = record.opportunity.normalizedSkills || [];
      totalPossible += 3;
      const overlap = baseSkills.filter(s => histSkills.includes(s)).length;
      if (baseSkills.length > 0) {
         similarityScore += (overlap / baseSkills.length) * 3;
      }

      // Feature 4: Route match
      totalPossible += 1;
      if (baseEvaluation.evaluationRoute === record.originalEvaluation.evaluationRoute) {
        similarityScore += 1;
      }

      const matchRatio = totalPossible > 0 ? similarityScore / totalPossible : 0;

      if (matchRatio >= 0.5) { // At least 50% similar
         similarCount++;
         
         const daysOld = (now - record.outcome.createdAt.getTime()) / (1000 * 60 * 60 * 24);
         let weight = 1.0;
         if (daysOld > 90) weight = 0.2;
         else if (daysOld > 30) weight = 0.6;
         
         // Increase weight for highly similar matches
         weight = weight * (matchRatio + 0.5);

         recentTimeDecayFactor += weight;

         // Determine Outcome Quality
         let outcomeScore = 0;
         if (record.outcome.status === 'WON' || record.outcome.paymentSuccess || record.outcome.clientFeedback === 'POSITIVE_FEEDBACK') {
            outcomeScore = 1.5;
         } else if (record.outcome.status === 'CLIENT_REPLIED' || record.outcome.proposalAccepted) {
            outcomeScore = 1.0;
         } else if (record.outcome.status === 'LOST' || record.outcome.paymentSuccess === false || record.outcome.clientFeedback === 'NEGATIVE_FEEDBACK') {
            outcomeScore = -1.5;
         } else if (record.outcome.status === 'NO_RESPONSE') {
            outcomeScore = -0.5;
         }

         if (outcomeScore > 0) successCount += (outcomeScore * weight);
         if (outcomeScore < 0) failureCount += (Math.abs(outcomeScore) * weight);
      }
    }

    let adjustment = 0;
    let explanation = "No historical intelligence. Neutral adjustment.";

    if (similarCount > 0) {
       const netSuccess = successCount - failureCount;
       adjustment = Math.max(-10, Math.min(10, netSuccess * 2));
       explanation = `AutoGig found ${similarCount} similar historical opportunities. Based on time-decayed win/loss ratios (Success: ${successCount.toFixed(1)}, Failure: ${failureCount.toFixed(1)}), confidence was adjusted by ${adjustment > 0 ? '+' : ''}${Math.round(adjustment)}.`;
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

    let finalScore = Math.max(0, Math.min(100, baseEvaluation.scoreBreakdown.overall + historicalIntelligence.historicalSuccessAdjustment));

    // Hard rejection rules remain absolute
    if (baseEvaluation.evaluationRoute === 'REJECT') {
       finalScore = baseEvaluation.scoreBreakdown.overall;
       if (historicalIntelligence.historicalSuccessAdjustment > 0) {
         historicalIntelligence.explanation += " Hard rejection rules override positive historical intelligence.";
       }
       historicalIntelligence.historicalSuccessAdjustment = 0;
    }

    return {
      ...baseEvaluation,
      historicalIntelligence,
      finalScore
    };
  }
}