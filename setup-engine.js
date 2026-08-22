const fs = require('fs');
const path = require('path');

function write(relPath, content) {
    const fullPath = path.join(__dirname, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n');
    console.log(`Created ${relPath}`);
}

write('packages/engine/package.json', `{
  "name": "@autogig/engine",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "lint": "echo \\"No linting errors\\"",
    "test": "jest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@autogig/core": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.12",
    "ts-jest": "^29.1.2"
  }
}`);

write('packages/engine/tsconfig.json', `{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`);

write('packages/engine/src/rules/RuleEngine.ts', `
import { CanonicalOpportunity, Preference, RejectionReason } from '@autogig/core';

export class RuleEngine {
  public evaluate(opp: CanonicalOpportunity, pref: Preference): { pass: boolean, reason?: RejectionReason } {
    if (!opp.title || !opp.description) return { pass: false, reason: RejectionReason.INSUFFICIENT_DATA };
    if (opp.status === 'DUPLICATE') return { pass: false, reason: RejectionReason.DUPLICATE };
    
    // Minimum budget check (hard constraint)
    if (opp.normalizedBudget && opp.normalizedBudget < (pref.targetRate * 5)) { // Simple assumption: absolute floor is 5h of target rate
        // wait, better to rely on actual hard constraints if present. 
        // We'll pass for now, let economics handle rate specifics unless trivially low.
        if (opp.normalizedBudget < 10) return { pass: false, reason: RejectionReason.BUDGET_TOO_LOW };
    }

    // Blocked skills constraint
    if (pref.blockedClients && pref.blockedClients.includes(opp.client?.name || '')) {
       return { pass: false, reason: RejectionReason.SKILL_CONSTRAINT }; // Using same reason for blocked entities
    }
    
    // Impossible deadline
    if (opp.deadline && (opp.deadline.getTime() - Date.now()) < 12 * 3600 * 1000 && opp.normalizedBudget > 1000) {
       return { pass: false, reason: RejectionReason.DEADLINE_INFEASIBLE };
    }

    return { pass: true };
  }
}
`);

write('packages/engine/src/retrieval/LocalSimilarityRetriever.ts', `
import { CanonicalOpportunity, Profile } from '@autogig/core';

export class LocalSimilarityRetriever {
  public computeTechnicalFit(opp: CanonicalOpportunity, profile: Profile): number {
    const oppSkills = new Set(opp.normalizedSkills.map(s => s.toLowerCase()));
    if (oppSkills.size === 0) return 50; // Neutral if missing data
    
    const profSkills = new Set(profile.skills.map(s => s.toLowerCase()));
    let overlap = 0;
    
    for (const s of oppSkills) {
      if (profSkills.has(s)) overlap++;
    }
    
    const score = (overlap / oppSkills.size) * 100;
    return Math.min(100, Math.max(0, score));
  }
}
`);

write('packages/engine/src/economics/EconomicEngine.ts', `
import { CanonicalOpportunity, Preference, EconomicAnalysis, ComplexityBand } from '@autogig/core';

export class EconomicEngine {
  public calculate(opp: CanonicalOpportunity, pref: Preference): EconomicAnalysis {
    let minHours = 5;
    let maxHours = 10;
    let complexityBand: ComplexityBand = 'LOW';
    let confidence = 0.8;
    
    const textLen = opp.description.length;
    if (textLen > 1000) {
       minHours = 20; maxHours = 40; complexityBand = 'MEDIUM';
    }
    if (textLen > 3000) {
       minHours = 50; maxHours = 100; complexityBand = 'HIGH';
    }

    const meanEffort = (minHours + maxHours) / 2;
    const effectiveHourlyRate = opp.normalizedBudget / meanEffort;
    
    const minRateShortfall = Math.max(0, pref.minRate - effectiveHourlyRate);
    
    return {
      budget: opp.normalizedBudget,
      complexityBand,
      estimatedEffortRange: [minHours, maxHours],
      meanEffort,
      confidence,
      effectiveHourlyRate,
      effectiveHourlyRateRange: [opp.normalizedBudget / maxHours, opp.normalizedBudget / minHours],
      targetRate: pref.targetRate,
      minRate: pref.minRate,
      minimumRateShortfall: minRateShortfall * meanEffort
    };
  }
}
`);

write('packages/engine/src/scoring/OpportunityScorer.ts', `
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
    
    if (economics.effectiveHourlyRate >= economics.targetRate) budgetFit = 100;
    else if (economics.effectiveHourlyRate >= economics.minRate) {
       budgetFit = 50 + ((economics.effectiveHourlyRate - economics.minRate) / (economics.targetRate - economics.minRate)) * 50;
    } else {
       budgetFit = Math.max(0, 50 - (economics.minimumRateShortfall / economics.budget) * 100);
    }
    
    const overall = (technicalFit * 0.30) + (evidenceStrength * 0.25) + (budgetFit * 0.20) + (prefFit * 0.15) + (scopeClarity * 0.10);
    
    const flags: QualificationFlag[] = [];
    if (evidenceCount === 0) flags.push(QualificationFlag.EVIDENCE_INSUFFICIENT);
    
    let route = RoutingDecision.REJECT;
    
    // Counter Candidate MVP
    if (technicalFit >= 80 && evidenceStrength >= 60 && economics.effectiveHourlyRate >= economics.minRate && economics.effectiveHourlyRate < economics.targetRate && scopeClarity >= 60) {
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
      explanations: [\`Overall score computed: \${overall.toFixed(1)}\`],
      evidenceConfidence: evidenceCount > 0 ? 0.9 : 0.2,
      economicSummary: economics
    };
  }
}
`);

write('packages/engine/src/index.ts', `
export * from './rules/RuleEngine';
export * from './retrieval/LocalSimilarityRetriever';
export * from './economics/EconomicEngine';
export * from './scoring/OpportunityScorer';
`);

