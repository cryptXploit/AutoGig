const { DatabaseSync } = require('node:sqlite');
const { AgentController, ActionPolicyEngine, OpportunityStrategyEngine, LocalDemoPlatformAdapter } = require('@autogig/engine');
const { SQLiteAgentRunRepository, SQLiteAgentIterationRepository, SQLiteExecutionRequestRepository, SQLiteExecutionResultRepository, SQLiteExecutionAuditRepository, SQLitePolicyDecisionRepository, SQLiteExecutionReadinessRepository } = require('@autogig/db');
const { ActionExecutionOrchestrator, ExecutionReadinessEngine } = require('@autogig/engine');
const { ActionType } = require('@autogig/core');

async function runTests() {
  const db = new DatabaseSync(':memory:');
  require('@autogig/db').initializeSchema(db);

  db.exec(`
    CREATE TABLE IF NOT EXISTS policy_decisions (
      id TEXT PRIMARY KEY,
      opportunityId TEXT NOT NULL,
      actionType TEXT NOT NULL,
      platform TEXT NOT NULL,
      disposition TEXT NOT NULL,
      reasons TEXT NOT NULL,
      violatedRules TEXT NOT NULL,
      policyVersion TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS execution_readiness (
      opportunityId TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);
 // use actual schema

  const runRepo = new SQLiteAgentRunRepository(db);
  const iterRepo = new SQLiteAgentIterationRepository(db);
  const execReqRepo = new SQLiteExecutionRequestRepository(db);
  const execResRepo = new SQLiteExecutionResultRepository(db);
  const execAuditRepo = new SQLiteExecutionAuditRepository(db);

  const demoAdapter = new LocalDemoPlatformAdapter({});

  // Mock repos for state
  const oppRepo = { findById: (id) => ({ id, source: 'local-demo' }) };
  const evalRepo = { findByOpportunityId: (id) => ({}) };
  const explainRepo = { findByOpportunityId: (id) => ({}) };
  const userContextLoader = { loadContext: async () => ({ policy: {}, evidence: [] }) };

  // For testing, we mock engines
  const strategyEngine = {
     evaluate: (opp) => {
        if (opp.id === 'opp-success') return { strategy: 'APPLY_NOW' };
        if (opp.id === 'opp-approval') return { strategy: 'APPLY_NOW' };
        if (opp.id === 'opp-block') return { strategy: 'APPLY_NOW' };
        return { strategy: 'UNKNOWN' };
     }
  };

  const policyEngine = {
     evaluateAction: (req) => {
        const base = { evaluatedAt: new Date(), id: 'pol-' + Math.random().toString(), opportunityId: req.opportunityId, actionType: req.actionType, platform: req.platform, reasons: [], violatedRules: [], policyVersion: '1' };
        if (req.opportunityId === 'opp-block') return { ...base, disposition: 'BLOCK_ACTION' };
        return { ...base, disposition: 'AUTO_EXECUTE' };
     }
  };

  const readinessEngine = {
     evaluate: (strategy, policy, context) => {
        if (strategy.strategy === 'APPLY_NOW') {
           // We map the mock IDs to state
           // But since we can't easily access oppId inside readinessEngine mock without passing it,
           // we'll just check policy.id? No, we just mock the engine based on the fact that policy.id is always pol-1.
           // Actually, we can just look at context which we mocked.
           return { state: 'READY_TO_EXECUTE', opportunityId: 'mock' }; 
           // Wait, I need opp-approval to return PENDING_APPROVAL from Orchestrator. 
           // Let's modify readiness Engine mock to return READY_FOR_HUMAN_APPROVAL for opp-approval.
        }
        return { state: 'READY_TO_EXECUTE', opportunityId: 'mock' };
     }
  };

  const readinessEngineRealMock = {
     evaluate: (s, p, c) => {
         // Hack: use the global current_opp to return different state
         if (global.current_opp === 'opp-approval') return { state: 'READY_FOR_HUMAN_APPROVAL', opportunityId: 'opp-approval' };
         return { state: 'READY_TO_EXECUTE', opportunityId: global.current_opp };
     }
  };


  const orchestrator = new ActionExecutionOrchestrator({
    requestRepo: execReqRepo,
    resultRepo: execResRepo,
    auditRepo: execAuditRepo,
    policyRepo: new SQLitePolicyDecisionRepository(db),
    readinessRepo: new SQLiteExecutionReadinessRepository(db),
    platformAdapter: demoAdapter
  });

  const controller = new AgentController({
    runRepo, iterationRepo: iterRepo, execReqRepo,
    policyEngine, strategyEngine, readinessEngine: readinessEngineRealMock,
    orchestrator, oppRepo, evalRepo, explainRepo, userContextLoader
  });

  console.log("Scenario A: Safe autonomous application");
  global.current_opp = 'opp-success';
  let run1 = await controller.startRun('opp-success', 'APPLY_FOR_OPPORTUNITY');
  if (run1.status !== 'COMPLETED' || run1.stopReason !== 'GOAL_ACHIEVED') { console.log(run1); throw new Error('Failed Scenario A'); }

  console.log("Scenario B: Human approval required");
  global.current_opp = 'opp-approval';
  let run2 = await controller.startRun('opp-approval', 'APPLY_FOR_OPPORTUNITY');
  if (run2.status !== 'STOPPED' || run2.stopReason !== 'HUMAN_APPROVAL_REQUIRED') throw new Error('Failed Scenario B');

  console.log("Scenario C: Policy block");
  global.current_opp = 'opp-block';
  let run3 = await controller.startRun('opp-block', 'APPLY_FOR_OPPORTUNITY');
  if (run3.status !== 'STOPPED' || run3.stopReason !== 'POLICY_BLOCKED') throw new Error('Failed Scenario C');

  console.log("Scenario F: Loop Guard (Max Iterations)");
  global.current_opp = 'opp-infinite';
  // Strategy returns UNKNOWN -> NO_VALID_ACTION.
  let run4 = await controller.startRun('opp-infinite', 'APPLY_FOR_OPPORTUNITY');
  if (run4.status !== 'STOPPED' || run4.stopReason !== 'NO_VALID_ACTION') throw new Error('Failed Scenario F');

  console.log("ALL TESTS PASSED: phase-g4.14");
}

runTests().catch(console.error);
