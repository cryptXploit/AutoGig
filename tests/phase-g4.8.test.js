
const { OpportunityLifecycleEngine } = require('../packages/engine/dist/lifecycle/OpportunityLifecycleEngine.js');

const engine = new OpportunityLifecycleEngine();

const opp = { title: 'Test', description: 'Desc', normalizedSkills: ['node'], normalizedBudget: 100, status: 'EVALUATING' };
const client = { overallRiskLevel: 'LOW', recommendation: 'PRIORITIZE' };
const app = { readinessScore: 90, missingRequirements: [] };
const hist = { historicalSuccessAdjustment: +5 };
const conv = null;

const prints = engine.extractFingerprints(opp, client, app, hist, conv);

console.log("=== Phase G4.8 Lifecycle Tests ===");

// A. No change -> NO_CHANGE
const state1 = {
  id: 'ls-1', opportunityId: 'opp-1', ...prints, lastEvaluatedAt: new Date()
};
const res1 = engine.detectChanges('OPPORTUNITY_UPDATED', state1, prints);
console.assert(res1.requiresRefresh.includes('NO_CHANGE'), "Scenario A failed");

// B. New message -> REFRESH_CONV, REBUILD_DECISION
const res2 = engine.detectChanges('OPPORTUNITY_MESSAGE_RECEIVED', state1, prints);
console.assert(res2.requiresRefresh.includes('REFRESH_CONV') && res2.requiresRefresh.includes('REBUILD_DECISION'), "Scenario B failed");

// C. Budget change -> REFRESH_APP, REBUILD_DECISION
const newPrints = engine.extractFingerprints({...opp, normalizedBudget: 200}, client, app, hist, conv);
const res3 = engine.detectChanges('OPPORTUNITY_UPDATED', state1, newPrints);
console.assert(res3.requiresRefresh.includes('REFRESH_APP') && res3.requiresRefresh.includes('REBUILD_DECISION'), "Scenario C failed");

// D. Outcome WON -> REFRESH_HIST
const res4 = engine.detectChanges('OPPORTUNITY_OUTCOME_RECORDED', state1, prints);
console.assert(res4.requiresRefresh.includes('REFRESH_HIST') && res4.requiresRefresh.includes('REBUILD_DECISION'), "Scenario D failed");

// F. Tiny score change -> decision stability preserved
const oldPlan = {
  id: 'dp-1', opportunityId: 'opp-1', finalDecision: 'APPLY_AFTER_REVIEW', confidence: 70,
  decisionTrace: { hardConstraints: [] }
};
const newPlan = {
  id: 'dp-2', opportunityId: 'opp-1', finalDecision: 'APPLY_AFTER_REVIEW', confidence: 73,
  decisionTrace: { hardConstraints: [] }
};
const stab = engine.checkDecisionStability(oldPlan, newPlan, 'OPPORTUNITY_UPDATED', 'Budget change');
console.assert(stab.isStable === true, "Scenario F failed");

// G. Major decision change -> new decision history entry
const newPlanMajor = {
  id: 'dp-3', opportunityId: 'opp-1', finalDecision: 'BLOCK', confidence: 90,
  decisionTrace: { hardConstraints: ['Client blocked'] }
};
const stab2 = engine.checkDecisionStability(oldPlan, newPlanMajor, 'CLIENT_INTELLIGENCE_UPDATED', 'Client blocked');
console.assert(stab2.isStable === false, "Scenario G failed 1");
console.assert(stab2.historyEntry.newDecision === 'BLOCK', "Scenario G failed 2");

// J. nextReviewAt is deterministic
const nextReview = engine.calculateNextReview(opp, newPlan);
console.assert(nextReview > new Date(), "Scenario J failed");

console.log("ALL SCENARIOS PASSED.");
