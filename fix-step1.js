const fs = require('fs');

// Update core types
let typesPath = 'packages/core/src/types/index.ts';
let types = fs.readFileSync(typesPath, 'utf8');
types = types.replace(/export interface EconomicAnalysis \{[\s\S]*?\n\}/, `export interface EconomicAnalysis {
  budgetStatus: 'KNOWN' | 'UNKNOWN';
  budget: number | null;
  complexityBand: ComplexityBand;
  estimatedEffortRange: [number, number];
  meanEffort: number;
  confidence: number;
  effectiveHourlyRate?: number | null;
  effectiveHourlyRateRange?: [number, number] | null;
  targetRate: number;
  minRate: number;
  minimumRateShortfall?: number | null;
}`);

// Add missing EvaluationRecord types if needed or just make sure schema matches.
fs.writeFileSync(typesPath, types);

// Update EconomicEngine
let ecoPath = 'packages/engine/src/economics/EconomicEngine.ts';
let ecoCode = `
import { CanonicalOpportunity, Preference, EconomicAnalysis, ComplexityBand } from '@autogig/core';

export class EconomicEngine {
  public calculate(opp: CanonicalOpportunity, pref: Preference): EconomicAnalysis {
    const desc = (opp.description || '').toLowerCase();
    
    const requirementCount = (desc.match(/require|must have|essential/g) || []).length;
    const featureCount = (desc.match(/feature|build|create|implement/g) || []).length;
    const integrationCount = (desc.match(/integrate|api|webhook|oauth/g) || []).length;
    const ambiguityIndicators = (desc.match(/maybe|unsure|tbd|figure out|discuss/g) || []).length;
    const deadlinePressure = opp.deadline && (opp.deadline.getTime() - Date.now()) < 7 * 24 * 3600 * 1000 ? 1 : 0;
    
    const complexityScore = requirementCount + featureCount + (integrationCount * 2) + ambiguityIndicators + deadlinePressure;
    
    let minHours = 5;
    let maxHours = 10;
    let complexityBand: ComplexityBand = 'LOW';
    let confidence = Math.max(0.2, 1.0 - (ambiguityIndicators * 0.1));
    
    if (complexityScore > 3) { minHours = 15; maxHours = 30; complexityBand = 'MEDIUM'; }
    if (complexityScore > 7) { minHours = 40; maxHours = 80; complexityBand = 'HIGH'; confidence -= 0.1; }
    if (complexityScore > 12) { minHours = 100; maxHours = 200; complexityBand = 'VERY_HIGH'; confidence -= 0.2; }

    const meanEffort = (minHours + maxHours) / 2;
    
    const isBudgetUnknown = opp.normalizedBudget === undefined || opp.normalizedBudget === null;
    const budget = isBudgetUnknown ? null : opp.normalizedBudget;
    
    let effectiveHourlyRate = null;
    let effectiveHourlyRateRange = null;
    let minimumRateShortfall = null;

    if (!isBudgetUnknown && budget !== null) {
      effectiveHourlyRate = budget / meanEffort;
      effectiveHourlyRateRange = [budget / maxHours, budget / minHours];
      minimumRateShortfall = Math.max(0, pref.minRate - effectiveHourlyRate) * meanEffort;
    }
    
    return {
      budgetStatus: isBudgetUnknown ? 'UNKNOWN' : 'KNOWN',
      budget,
      complexityBand,
      estimatedEffortRange: [minHours, maxHours],
      meanEffort,
      confidence,
      effectiveHourlyRate,
      effectiveHourlyRateRange: effectiveHourlyRateRange as any,
      targetRate: pref.targetRate,
      minRate: pref.minRate,
      minimumRateShortfall
    };
  }
}
`;
fs.writeFileSync(ecoPath, ecoCode.trim() + '\n');

// Update Scorer to handle budget UNKNOWN
let scorerPath = 'packages/engine/src/rules/OpportunityScorer.ts';
let scorerCode = fs.readFileSync(scorerPath, 'utf8');
scorerCode = scorerCode.replace(/const effectiveRate = ecoResult.effectiveHourlyRate;/g, "const effectiveRate = ecoResult.effectiveHourlyRate ?? ecoResult.targetRate;");
scorerCode = scorerCode.replace(/let budgetFit = 50;/g, "let budgetFit = ecoResult.budgetStatus === 'UNKNOWN' ? 50 : 0;");
scorerCode = scorerCode.replace(/budgetFit = Math\.min\(100, Math\.max\(0, \(effectiveRate \/ ecoResult\.targetRate\) \* 100\)\);/g, "if (ecoResult.budgetStatus === 'KNOWN') budgetFit = Math.min(100, Math.max(0, (effectiveRate / ecoResult.targetRate) * 100));");
fs.writeFileSync(scorerPath, scorerCode);

console.log('Updated engine and types');
