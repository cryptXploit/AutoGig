const fs = require('fs');
const path = require('path');

function replace(file, search, repl) {
  let p = path.join(__dirname, file);
  if (!fs.existsSync(p)) return;
  let text = fs.readFileSync(p, 'utf8');
  fs.writeFileSync(p, text.replace(search, repl));
}

// 1. Add CLIENT_BLOCKED to RejectionReason
let coreTypes = fs.readFileSync('packages/core/src/types/index.ts', 'utf8');
if (!coreTypes.includes('CLIENT_BLOCKED')) {
  coreTypes = coreTypes.replace(/SKILL_CONSTRAINT = 'SKILL_CONSTRAINT',/, "SKILL_CONSTRAINT = 'SKILL_CONSTRAINT',\n  CLIENT_BLOCKED = 'CLIENT_BLOCKED',");
}
fs.writeFileSync('packages/core/src/types/index.ts', coreTypes);

// 2. RuleEngine fixes: remove `Duplicate` title check, add CLIENT_BLOCKED, and handle `isDuplicate`
let ruleEngine = `
import { CanonicalOpportunity, Preference, RejectionReason } from '@autogig/core';

export class RuleEngine {
  public evaluate(opp: CanonicalOpportunity & { isDuplicate?: boolean }, pref: Preference): { pass: boolean, reason?: RejectionReason } {
    if (!opp.title || !opp.description) return { pass: false, reason: RejectionReason.INSUFFICIENT_DATA };
    
    // Duplicate detection (now driven by repository flag)
    if (opp.isDuplicate) return { pass: false, reason: RejectionReason.DUPLICATE };
    
    if ((opp.normalizedBudget || 0) > 0 && (opp.normalizedBudget || 0) < 10) return { pass: false, reason: RejectionReason.BUDGET_TOO_LOW };

    if (pref.blockedClients && pref.blockedClients.includes(opp.client?.name || '')) {
       return { pass: false, reason: RejectionReason.CLIENT_BLOCKED };
    }
    
    if (opp.deadline && (opp.deadline.getTime() - Date.now()) < 12 * 3600 * 1000 && (opp.normalizedBudget || 0) > 1000) {
       return { pass: false, reason: RejectionReason.DEADLINE_INFEASIBLE };
    }

    return { pass: true };
  }
}
`;
fs.writeFileSync('packages/engine/src/rules/RuleEngine.ts', ruleEngine.trim() + '\n');

// 3. EconomicEngine: Measurable signals and unknown budget handling
let ecoEngine = `
import { CanonicalOpportunity, Preference, EconomicAnalysis, ComplexityBand } from '@autogig/core';

export class EconomicEngine {
  public calculate(opp: CanonicalOpportunity, pref: Preference): EconomicAnalysis {
    const desc = (opp.description || '').toLowerCase();
    
    // Measurable signals
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
    
    // Unknown Budget handling
    const isBudgetUnknown = !opp.normalizedBudget || opp.normalizedBudget === 0;
    const effectiveBudget = isBudgetUnknown ? (pref.targetRate * meanEffort) : opp.normalizedBudget; // Assume target if unknown for routing proxy
    
    const effectiveHourlyRate = effectiveBudget / meanEffort;
    const minRateShortfall = Math.max(0, pref.minRate - effectiveHourlyRate);
    
    return {
      budget: isBudgetUnknown ? 0 : opp.normalizedBudget,
      complexityBand,
      estimatedEffortRange: [minHours, maxHours],
      meanEffort,
      confidence,
      effectiveHourlyRate: isBudgetUnknown ? 0 : effectiveHourlyRate,
      effectiveHourlyRateRange: isBudgetUnknown ? [0, 0] : [opp.normalizedBudget / maxHours, opp.normalizedBudget / minHours],
      targetRate: pref.targetRate,
      minRate: pref.minRate,
      minimumRateShortfall: isBudgetUnknown ? 0 : minRateShortfall * meanEffort
    };
  }
}
`;
fs.writeFileSync('packages/engine/src/economics/EconomicEngine.ts', ecoEngine.trim() + '\n');

// 4. Local Retrieval Naming
const retriever = `
import { CanonicalOpportunity, Profile } from '@autogig/core';

// Deterministic skill-overlap baseline.
// Future migration: LocalSimilarityRetriever -> Gemini Embedding 2 -> Firestore KNN
export class LocalSimilarityRetriever {
  public computeTechnicalFit(opp: CanonicalOpportunity, profile: Profile): number {
    const oppSkills = new Set(opp.normalizedSkills.map(s => s.toLowerCase()));
    if (oppSkills.size === 0) return 50; 
    
    const profSkills = new Set(profile.skills.map(s => s.toLowerCase()));
    let overlap = 0;
    for (const s of oppSkills) {
      if (profSkills.has(s)) overlap++;
    }
    
    return Math.min(100, Math.max(0, (overlap / oppSkills.size) * 100));
  }
}
`;
fs.writeFileSync('packages/engine/src/retrieval/LocalSimilarityRetriever.ts', retriever.trim() + '\n');

console.log('Updated core types and engine files.');
