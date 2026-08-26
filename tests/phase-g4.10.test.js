
const { ActionPolicyEngine, LocalDemoPlatformPolicy } = require('../packages/engine/dist/policy/ActionPolicyEngine.js');
const { ActionType, ActionDisposition } = require('../packages/core/dist/index.js');

const engine = new ActionPolicyEngine();
const platform = new LocalDemoPlatformPolicy();
platform.platform = 'local-demo';

const baseUser = {
  minimumRate: 50,
  targetRate: 100,
  blockedClients: ['Bad Corp'],
  blockedKeywords: ['scam'],
  allowedPlatforms: ['local-demo'],
  allowedActionTypes: [ActionType.SEND_PROPOSAL],
  maxDailyApplications: 10,
  autonomyLevel: 'HIGH_AUTONOMY'
};

const req = {
  opportunityId: 'opp-1',
  actionType: ActionType.SEND_PROPOSAL,
  platform: 'local-demo',
  proposedRate: 80,
  targetClient: 'Good Corp'
};

console.log("=== Phase G4.10 Policy Engine Tests ===");

// A. Valid AUTO_EXECUTE action
let decision = engine.evaluateAction(req, baseUser, platform, null, null, 0);
console.assert(decision.disposition === ActionDisposition.AUTO_EXECUTE, "Scenario A failed");

// B. Human approval action
const reqManual = { ...req, actionType: ActionType.ACCEPT_CONTRACT };
decision = engine.evaluateAction(reqManual, baseUser, platform, null, null, 0);
console.assert(decision.disposition === ActionDisposition.REQUIRE_HUMAN_APPROVAL, "Scenario B failed");

// C. Below minimum rate
const reqLowRate = { ...req, proposedRate: 40 };
decision = engine.evaluateAction(reqLowRate, baseUser, platform, null, null, 0);
console.assert(decision.disposition === ActionDisposition.BLOCK_ACTION, "Scenario C failed");

// D. Blocked client
const reqBlockedClient = { ...req, targetClient: 'Bad Corp' };
decision = engine.evaluateAction(reqBlockedClient, baseUser, platform, null, null, 0);
console.assert(decision.disposition === ActionDisposition.BLOCK_ACTION, "Scenario D failed");

// E. Unsupported skill (Missing Evidence in Explainability)
const explainability = { missingEvidence: ['Verified evidence for skill: python'] };
decision = engine.evaluateAction(req, baseUser, platform, null, explainability, 0);
console.assert(decision.disposition === ActionDisposition.BLOCK_ACTION, "Scenario E failed");

// H. Daily application limit
decision = engine.evaluateAction(req, baseUser, platform, null, null, 10);
console.assert(decision.disposition === ActionDisposition.BLOCK_ACTION, "Scenario H failed");
console.assert(decision.violatedRules.includes('RATE_LIMIT_EXCEEDED'), "Scenario H failed rules");

// J. Autonomy level cannot override hard rules
const userManual = { ...baseUser, autonomyLevel: 'MANUAL' };
decision = engine.evaluateAction(reqBlockedClient, userManual, platform, null, null, 0);
console.assert(decision.disposition === ActionDisposition.BLOCK_ACTION, "Scenario J failed (must block, not require approval)");

console.log("ALL SCENARIOS PASSED.");
