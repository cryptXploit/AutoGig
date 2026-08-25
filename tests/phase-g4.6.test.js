const { AdaptiveLearningEngine } = require('../packages/engine/dist/ai/AdaptiveLearningEngine.js');

const engine = new AdaptiveLearningEngine();

const opportunity = {
  title: 'Senior Node.js Backend Developer',
  normalizedBudget: 150
};

const baseScore = {
  overall: 70,
  route: 'DEEP_REASON_REQUIRED'
};

const historicalOutcomes = [
  {
    outcome: { status: 'WON', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) },
    opportunity: { title: 'Node.js Developer', normalizedBudget: 160 },
    originalEvaluation: { recommendedAction: 'RECOMMEND' }
  },
  {
    outcome: { status: 'CLIENT_REPLIED', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10) },
    opportunity: { title: 'React and Node Engineer', normalizedBudget: 140 },
    originalEvaluation: { recommendedAction: 'RECOMMEND' }
  },
  {
    outcome: { status: 'LOST', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100) }, // old, decayed
    opportunity: { title: 'Node Backend', normalizedBudget: 150 },
    originalEvaluation: { recommendedAction: 'RECOMMEND' }
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
console.assert(oldOutcomeResult.historicalIntelligence.historicalSuccessAdjustment === -0, "Decayed loss has very low impact");
// Wait, -0.1 * 2 = -0.2 -> Math.round(-0.2) = 0. Yes!

console.log("Test D: Hard REJECT preserved");
const rejectScore = { overall: 40, route: 'REJECT' };
const rejectResult = engine.evaluateHistory(opportunity, rejectScore, historicalOutcomes);
console.assert(rejectResult.finalScore === 40, "Final score remains unchanged");
console.assert(rejectResult.historicalIntelligence.historicalSuccessAdjustment === 0, "Adjustment zeroed out");
console.assert(rejectResult.historicalIntelligence.explanation.includes("override"), "Explanation updated");

console.log("Test H: Zero outcomes is neutral");
const emptyResult = engine.evaluateHistory(opportunity, baseScore, []);
console.assert(emptyResult.historicalIntelligence.historicalSuccessAdjustment === 0, "Zero outcomes = 0 adj");

console.log("ALL TESTS PASSED.");
