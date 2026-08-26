const { UserContextValidator, UserEvidenceResolver, UserIntelligenceContextLoader, ExecutionReadinessEngine } = require('../packages/engine/dist');
const { ActionDisposition, StrategyType } = require('../packages/core/dist');

async function run() {
  console.log("=== Phase G4.12 Unit Tests ===");
  
  // A. valid profile & J, K, L validation checks
  const validator = new UserContextValidator();
  
  const validPolicy = {
    minimumRate: 50, targetRate: 100, maximumNegotiationDiscount: 10,
    maximumNegotiationRounds: 2, blockedClients: [], blockedKeywords: [],
    allowedPlatforms: [], allowedActionTypes: ['SEND_PROPOSAL'],
    requireApprovalForMessaging: true, requireApprovalForProposalSubmission: true,
    requireApprovalForNegotiation: true, maxDailyApplications: 10, maxDailyMessages: 20,
    maxActiveNegotiations: 5, minimumConfidenceForAutoDraft: 80,
    minimumConfidenceForAutoExecute: 95, autoSendEnabled: true,
    autoNegotiateEnabled: false, autoProposalEnabled: false,
    workingHours: '9-5', timezone: 'UTC', autonomyLevel: 'SUPERVISED'
  };

  const validProfile = { id: 'u1' };

  console.log("Test A: Valid profile");
  const errors = validator.validate(validProfile, validPolicy);
  if (errors.length !== 0) throw new Error("Expected 0 errors");

  console.log("Test B: Invalid minimum/target rate");
  const err1 = validator.validate(validProfile, { ...validPolicy, minimumRate: 200 });
  if (!err1.some(e => e.includes('targetRate'))) throw new Error("Expected targetRate error");

  console.log("Test F: Evidence resolver");
  const evidence = [{ id: 'e1', userId: 'u1', category: 'SKILL', claim: 'TypeScript', verified: true }, { id: 'e2', userId: 'u1', category: 'SKILL', claim: 'Python', verified: false }];
  const resolver = new UserEvidenceResolver(evidence);
  
  const res1 = resolver.resolveClaim('TypeScript');
  if (res1.status !== 'SUPPORTED') throw new Error("Expected SUPPORTED");

  const res2 = resolver.resolveClaim('Python');
  if (res2.status !== 'PARTIALLY_SUPPORTED') throw new Error("Expected PARTIALLY_SUPPORTED");

  console.log("Test L: Execution Readiness Engine");
  const engine = new ExecutionReadinessEngine();
  const loader = new UserIntelligenceContextLoader(
    { findById: () => validProfile },
    { findById: () => validPolicy },
    { findByUserId: () => evidence },
    validator
  );
  
  const ctx = loader.load('u1');
  
  const readiness1 = engine.evaluate(
    { opportunityId: 'o1', strategy: StrategyType.SKIP }, 
    { disposition: ActionDisposition.AUTO_DRAFT_ONLY }, 
    ctx
  );
  if (readiness1.state !== 'BLOCKED') throw new Error("Expected BLOCKED state for SKIP");

  const readiness2 = engine.evaluate(
    { opportunityId: 'o2', strategy: StrategyType.PREPARE_AND_APPLY }, 
    { disposition: ActionDisposition.AUTO_DRAFT_ONLY }, 
    ctx
  );
  if (readiness2.state !== 'READY_TO_DRAFT') throw new Error("Expected READY_TO_DRAFT");

  const readiness3 = engine.evaluate(
    { opportunityId: 'o3', strategy: StrategyType.APPLY_NOW }, 
    { disposition: ActionDisposition.AUTO_EXECUTE }, 
    ctx
  );
  if (readiness3.state !== 'READY_FOR_REVIEW') throw new Error("Expected READY_FOR_REVIEW since autoSend is true but bounded safely");

  console.log("ALL UNIT TESTS PASSED");
}

run().catch(e => { console.error(e); process.exit(1); });
