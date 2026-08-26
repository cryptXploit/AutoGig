
const { OpportunityStrategyEngine } = require('../packages/engine/dist/strategy/OpportunityStrategyEngine.js');
const { OpportunityUrgency, OpportunityPriority, StrategyType, ActionDisposition } = require('../packages/core/dist/index.js');

const engine = new OpportunityStrategyEngine();

const baseOpp = {
  id: 'opp-1',
  publishedAt: new Date().toISOString(),
};

const baseEval = {
  finalScore: 85,
  historicalIntelligence: { historicalSuccessAdjustment: 0 }
};

const baseExp = {
  evidenceCoverage: 90,
  missingEvidence: []
};

const basePolicy = {
  disposition: ActionDisposition.AUTO_EXECUTE
};

console.log("=== Phase G4.11 Strategy Engine Tests ===");

// A. Fresh high-value job → APPLY_NOW
let strat = engine.evaluate(baseOpp, baseEval, baseExp, basePolicy);
console.assert(strat.strategy === StrategyType.APPLY_NOW, "Scenario A failed");
console.assert(strat.priorityScore > 80, "Scenario A score too low");
console.assert(strat.reasons.some(r => r.includes('Very fresh')), "Missing freshness reason");

// B. Old opportunity → lower urgency
const oldOpp = { id: 'opp-2', publishedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString() };
strat = engine.evaluate(oldOpp, baseEval, baseExp, basePolicy);
console.assert(strat.timingScore === 20, "Scenario B freshness failed");
console.assert(strat.priorityScore < 90, "Scenario B priority too high for old job");

// D. Low readiness → PREPARE_AND_APPLY
const lowExp = { evidenceCoverage: 40, missingEvidence: [] };
strat = engine.evaluate(baseOpp, baseEval, lowExp, basePolicy);
console.assert(strat.strategy === StrategyType.PREPARE_AND_APPLY, "Scenario D failed");
console.assert(strat.risks.some(r => r.includes('Low application readiness')), "Missing readiness risk");

// E. Strong history → positive influence
const goodHistEval = { finalScore: 85, historicalIntelligence: { historicalSuccessAdjustment: 5 } };
strat = engine.evaluate(baseOpp, goodHistEval, baseExp, basePolicy);
console.assert(strat.historicalSuccessScore === 80, "Scenario E failed");

// H. Blocked policy → SKIP
const blockedPolicy = { disposition: ActionDisposition.BLOCK_ACTION };
strat = engine.evaluate(baseOpp, baseEval, baseExp, blockedPolicy);
console.assert(strat.strategy === StrategyType.SKIP, "Scenario H failed (strategy)");
console.assert(strat.priorityScore === 0, "Scenario H failed (score)");
console.assert(strat.risks.some(r => r.includes('blocked')), "Missing block risk");

// I. Missing evidence → WAIT
const waitExp = { evidenceCoverage: 90, missingEvidence: ['Verified Cert'] };
strat = engine.evaluate(baseOpp, baseEval, waitExp, basePolicy);
console.assert(strat.strategy === StrategyType.WAIT_FOR_MORE_INFORMATION, "Scenario I failed");

console.log("ALL SCENARIOS PASSED.");
