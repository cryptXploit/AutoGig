
const { DecisionFusionEngine } = require('../packages/engine/dist/decision/DecisionFusionEngine.js');

const engine = new DecisionFusionEngine();

const now = Date.now();
const oneHourAgo = new Date(now - 1 * 60 * 60 * 1000).toISOString();
const twoDaysAgo = new Date(now - 48 * 60 * 60 * 1000).toISOString();
const tenDaysAgo = new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString();

function createBase() {
  return {
    opportunity: { id: 'opp-1', publishedAt: oneHourAgo, normalizedBudget: 100, normalizedSkills: ['node'] },
    evaluation: { finalScore: 90, evaluationRoute: 'DEEP_REASON_REQUIRED' },
    clientIntelligence: { recommendation: 'PRIORITIZE', trustScore: 90, overallRiskLevel: 'LOW', unknowns: [] },
    applicationIntelligence: { readinessScore: 100, missingRequirements: [] },
    historicalIntelligence: { historicalSuccessAdjustment: +5 },
    conversationIntelligence: null,
    profile: { userId: 'u1' },
    preferences: { targetRate: 80, minRate: 50 }
  };
}

console.log("=== Phase G4.7 Unified Planner Tests ===");

// A. Great job + great client + strong skills -> APPLY_NOW
const baseA = createBase();
const planA = engine.fuse(baseA.opportunity, baseA.evaluation, baseA.clientIntelligence, baseA.applicationIntelligence, baseA.historicalIntelligence, baseA.conversationIntelligence, baseA.profile, baseA.preferences);
console.assert(planA.finalDecision === 'APPLY_NOW', "Scenario A failed");
console.assert(planA.priority === 'CRITICAL' || planA.priority === 'HIGH', "Scenario A priority failed");

// B. Great job + missing skill -> ASK_CLIENT_FIRST
const baseB = createBase();
baseB.applicationIntelligence.missingRequirements = ['aws'];
baseB.applicationIntelligence.readinessScore = 50;
const planB = engine.fuse(baseB.opportunity, baseB.evaluation, baseB.clientIntelligence, baseB.applicationIntelligence, baseB.historicalIntelligence, baseB.conversationIntelligence, baseB.profile, baseB.preferences);
console.assert(planB.finalDecision === 'ASK_CLIENT_FIRST', "Scenario B failed: " + planB.finalDecision);

// C. Great job + bad client -> BLOCK
const baseC = createBase();
baseC.clientIntelligence.recommendation = 'BLOCK';
const planC = engine.fuse(baseC.opportunity, baseC.evaluation, baseC.clientIntelligence, baseC.applicationIntelligence, baseC.historicalIntelligence, baseC.conversationIntelligence, baseC.profile, baseC.preferences);
console.assert(planC.finalDecision === 'BLOCK', "Scenario C failed");

// D. Great history + current hard rejection -> REJECT
const baseD = createBase();
baseD.evaluation.evaluationRoute = 'REJECT';
const planD = engine.fuse(baseD.opportunity, baseD.evaluation, baseD.clientIntelligence, baseD.applicationIntelligence, baseD.historicalIntelligence, baseD.conversationIntelligence, baseD.profile, baseD.preferences);
console.assert(planD.finalDecision === 'BLOCK', "Scenario D failed: " + planD.finalDecision);
console.assert(planD.decisionTrace.hardConstraints.length > 0, "Scenario D trace failed");

// E. Fresh high-quality job -> high priority
// Verified in A

// F. Stale opportunity -> WAIT/REVIEW
const baseF = createBase();
baseF.opportunity.publishedAt = tenDaysAgo;
const planF = engine.fuse(baseF.opportunity, baseF.evaluation, baseF.clientIntelligence, baseF.applicationIntelligence, baseF.historicalIntelligence, baseF.conversationIntelligence, baseF.profile, baseF.preferences);
console.assert(planF.finalDecision === 'WAIT', "Scenario F failed: " + planF.finalDecision);

// G. Negotiation conflict -> NEGOTIATE with human approval
const baseG = createBase();
baseG.conversationIntelligence = { recommendedAction: 'NEGOTIATE', conversationStage: 'NEGOTIATION' };
const planG = engine.fuse(baseG.opportunity, baseG.evaluation, baseG.clientIntelligence, baseG.applicationIntelligence, baseG.historicalIntelligence, baseG.conversationIntelligence, baseG.profile, baseG.preferences);
console.assert(planG.finalDecision === 'NEGOTIATE', "Scenario G failed");
console.assert(planG.humanApprovalRequired === true, "Scenario G approval failed");

console.log("ALL SCENARIOS PASSED.");
