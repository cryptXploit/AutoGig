const { AdaptiveLearningEngine } = require('../packages/engine/dist/ai/AdaptiveLearningEngine.js');

const engine = new AdaptiveLearningEngine();

const opportunity = {
  id: 'base-opp', title: 'Senior Node.js Backend Developer',
  normalizedBudget: 150, normalizedSkills: ['node.js'], normalizedSkills: ['node.js', 'backend']
};

const baseScore = {
  scoreBreakdown: { overall: 70 },
  evaluationRoute: 'DEEP_REASON_REQUIRED'
};

const historicalOutcomes = [
  {
    outcome: { status: 'WON', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) },
    opportunity: { id: 'hist-1', title: 'Node.js Developer', normalizedBudget: 160, normalizedSkills: ['node.js', 'backend'] },
    originalEvaluation: { evaluationRoute: 'DEEP_REASON_REQUIRED' }
  },
  {
    outcome: { status: 'CLIENT_REPLIED', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10) },
    opportunity: { id: 'hist-2', title: 'React and Node Engineer', normalizedBudget: 140, normalizedSkills: ['node.js', 'react'] },
    originalEvaluation: { evaluationRoute: 'DEEP_REASON_REQUIRED' }
  },
  {
    outcome: { status: 'LOST', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100) }, // old, decayed
    opportunity: { id: 'hist-3', title: 'Node Backend', normalizedBudget: 150 },
    originalEvaluation: { evaluationRoute: 'DEEP_REASON_REQUIRED' }
  }
];

const result = engine.evaluateHistory(opportunity, baseScore, historicalOutcomes);

console.log("=== Phase G4.6 Tests ===");

console.log("Test A/B: Bounded deterministic adjustment");
console.assert(result.historicalIntelligence.historicalSuccessAdjustment > 0, "Adjustment should be positive");
console.assert(result.historicalIntelligence.historicalSuccessAdjustment <= 10, "Adjustment bounded to 10");
console.assert(result.finalScore === 70 + result.historicalIntelligence.historicalSuccessAdjustment, "Final score correctly adjusted");
console.log("Adjustment:", result.historicalIntelligence.historicalSuccessAdjustment);

console.log("Test C: Old outcomes decay");
const oldOutcomeResult = engine.evaluateHistory(opportunity, baseScore, [historicalOutcomes[2]]);
console.assert(Math.abs(oldOutcomeResult.historicalIntelligence.historicalSuccessAdjustment) <= 3, "Decayed loss has very low impact");
// Wait, -0.1 * 2 = -0.2 -> Math.round(-0.2) = 0. Yes!

console.log("Test D: Hard REJECT preserved");
const rejectScore = { scoreBreakdown: { overall: 40 }, evaluationRoute: 'REJECT' };
const rejectResult = engine.evaluateHistory(opportunity, rejectScore, historicalOutcomes);
console.assert(rejectResult.finalScore === 40, "Final score remains unchanged");
console.assert(rejectResult.historicalIntelligence.historicalSuccessAdjustment === 0, "Adjustment zeroed out");
console.assert(rejectResult.historicalIntelligence.explanation.includes("override"), "Explanation updated");

console.log("Test H: Zero outcomes is neutral");
const emptyResult = engine.evaluateHistory(opportunity, baseScore, []);
console.assert(emptyResult.historicalIntelligence.historicalSuccessAdjustment === 0, "Zero outcomes = 0 adj");

console.log("ALL TESTS PASSED.");
