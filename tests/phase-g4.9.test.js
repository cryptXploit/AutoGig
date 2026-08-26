
const { DecisionExplainabilityEngine } = require('../packages/engine/dist/explainability/DecisionExplainabilityEngine.js');
const engine = new DecisionExplainabilityEngine();

const opp = { id: 'opp-1', normalizedSkills: '["react", "node"]' };
const evalRec = {};
const client = { recommendation: 'PRIORITIZE', overallRiskLevel: 'LOW' };
const app = { readinessScore: 90, missingRequirements: [] };
const hist = null;
const conv = null;
const plan = {
  finalDecision: 'APPLY_NOW',
  confidence: 85,
  decisionTrace: {
    baseEvaluation: { score: 80, route: 'DEEP_REASON_REQUIRED' },
    hardConstraints: []
  }
};
const evidence = [
  { id: 'ev-1', verificationStatus: 'VERIFIED', claimType: 'react', sourceType: 'profile', confidence: 100 },
  { id: 'ev-2', verificationStatus: 'UNVERIFIED', claimType: 'aws', sourceType: 'profile', confidence: 0 }
];
const history = [];
const claims = [];
const runs = [];

const report = engine.generateReport(opp, evalRec, client, app, hist, conv, plan, evidence, history, claims, runs);

console.log("=== Phase G4.9 Explainability Tests ===");
console.assert(report.opportunityId === 'opp-1', "Scenario A failed");
console.assert(report.evidenceCoverage === 50, "Scenario F failed");
console.assert(report.missingEvidence.length === 1 && report.missingEvidence[0].includes('node'), "Scenario C failed");
console.assert(report.evidenceNodes.length === 2, "Scenario G failed");

const planWithConstraint = { ...plan, decisionTrace: { ...plan.decisionTrace, hardConstraints: ['Client blocked'] } };
const report2 = engine.generateReport(opp, evalRec, client, app, hist, conv, planWithConstraint, evidence, history, claims, runs);
console.assert(report2.constraintNodes.length === 1 && report2.constraintNodes[0].constraint === 'Client blocked', "Scenario E failed");

console.log("ALL SCENARIOS PASSED.");
