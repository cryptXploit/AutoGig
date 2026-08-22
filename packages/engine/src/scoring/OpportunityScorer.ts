import { ScoreBreakdown, QualificationFlag, RoutingDecision, EconomicAnalysis } from '@autogig/core';

export class OpportunityScorer {
  public score(
    technicalFit: number, 
    evidenceCount: number, 
    economics: EconomicAnalysis, 
    prefFit: number, 
    scopeClarity: number
  ): ScoreBreakdown {
    
    const evidenceStrength = evidenceCount > 0 ? 80 : 0;
    let budgetFit = 0;
    
    if ((economics.effectiveHourlyRate ?? economics.targetRate) >= economics.targetRate) budgetFit = 100;
    else if ((economics.effectiveHourlyRate ?? economics.targetRate) >= economics.minRate) {
       budgetFit = 50 + (((economics.effectiveHourlyRate ?? economics.targetRate) - economics.minRate) / (economics.targetRate - economics.minRate)) * 50;
    } else {
       budgetFit = Math.max(0, 50 - ((economics.minimumRateShortfall ?? 0) / (economics.budget ?? 0)) * 100);
    }
    
    const overall = (technicalFit * 0.30) + (evidenceStrength * 0.25) + (budgetFit * 0.20) + (prefFit * 0.15) + (scopeClarity * 0.10);
    
    const flags: QualificationFlag[] = [];
    if (evidenceCount === 0) flags.push(QualificationFlag.EVIDENCE_INSUFFICIENT);
    
    let route = RoutingDecision.REJECT;
    
    // Counter Candidate MVP
    if (technicalFit >= 80 && evidenceStrength >= 60 && (economics.effectiveHourlyRate ?? economics.targetRate) >= economics.minRate && (economics.effectiveHourlyRate ?? economics.targetRate) < economics.targetRate && scopeClarity >= 60) {
      route = RoutingDecision.COUNTER_CANDIDATE;
    } else {
      if (overall < 50) route = RoutingDecision.REJECT;
      else if (overall >= 50 && overall < 80) route = RoutingDecision.DEEP_REASON_REQUIRED;
      else if (overall >= 80) route = RoutingDecision.HIGH_PRIORITY_DEEP_REASON;
    }
    
    return {
      overall,
      technicalFit,
      evidenceStrength,
      budgetFit,
      preferenceFit: prefFit,
      scopeClarity,
      route,
      qualificationFlags: flags,
      explanations: [`Overall score computed: ${overall.toFixed(1)}`],
      evidenceConfidence: evidenceCount > 0 ? 0.9 : 0.2,
      economicSummary: economics
    };
  }
}
