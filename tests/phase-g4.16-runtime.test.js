const { OpportunitySimulator, OpportunityStrategyEngine, ActionPolicyEngine, ExecutionReadinessEngine } = require('@autogig/engine');

async function runTests() {
  console.log("=== G4.16 Opportunity Simulator & What-If ===");

  const simulator = new OpportunitySimulator({
    strategyEngine: new OpportunityStrategyEngine(),
    policyEngine: new ActionPolicyEngine(),
    readinessEngine: new ExecutionReadinessEngine()
  });

  const opp = { id: 'opp-1', budget: 40, source: 'local-demo' };
  const userContext = {
    profile: { id: 'user-1' },
    policy: { minimumRate: 30, requireHumanApproval: false, blockedClients: [] },
    evidence: [],
    isValid: true,
    validationErrors: []
  };
  const evaluation = { finalScore: 70, historicalIntelligence: null };
  const explainability = { evidenceCoverage: 90 };
  const careerMemory = [];

  // 1. Baseline
  const scenarioBaseline = {
    id: 's-1',
    name: 'Baseline',
    overrides: {}
  };
  
  const resBase = simulator.simulate(scenarioBaseline, opp, evaluation, explainability, careerMemory, userContext);
  
  // Test A - Baseline match
  if (resBase.baseline.policyDisposition !== 'AUTO_EXECUTE') throw new Error("Test A Failed");
  if (resBase.comparison.changed) throw new Error("Test A Failed: Baseline should not change.");

  // Test B - Minimum rate
  const resRate = simulator.simulate({
    id: 's-2', name: 'Higher Rate', overrides: { MIN_RATE: 50 }
  }, opp, evaluation, explainability, careerMemory, userContext);
  
  if (resRate.scenario.policyDisposition !== 'BLOCK_ACTION') throw new Error('Test B Failed: Min rate override didn\'t block. Actual: ' + resRate.scenario.policyDisposition);
  if (!resRate.comparison.policyChanged) throw new Error("Test B Failed: Policy change not detected.");

  // Test C - Strategy
  const resStrat = simulator.simulate({
    id: 's-3', name: 'Force Negotiate', overrides: { STRATEGY: 'NEGOTIATE_FIRST' }
  }, opp, evaluation, explainability, careerMemory, userContext);
  
  if (resStrat.scenario.strategy !== 'NEGOTIATE_FIRST') throw new Error("Test C Failed");
  if (resStrat.scenario.projectedAction !== 'NEGOTIATE_RATE') throw new Error("Test C Failed: Action didn't map.");

  // Test D - Human approval
  const resApp = simulator.simulate({
    id: 's-4', name: 'Approval', overrides: { REQUIRE_HUMAN_APPROVAL: true }
  }, opp, evaluation, explainability, careerMemory, userContext);
  
  if (resApp.scenario.policyDisposition !== 'REQUIRE_HUMAN_APPROVAL') throw new Error('Test D Failed. Actual: ' + resApp.scenario.policyDisposition);

  // Test E - Memory OFF
  const memoryRecords = [{
     category: 'STRATEGY',
     key: 'STRATEGY:APPLY_NOW',
     successRate: 0.9,
     confidenceScore: 0.8,
  }];
  
  // with memory
  const resMemOn = simulator.simulate(scenarioBaseline, opp, evaluation, explainability, memoryRecords, userContext);
  const resMemOff = simulator.simulate({
     id: 's-5', name: 'Mem OFF', overrides: { USE_MEMORY: false }
  }, opp, evaluation, explainability, memoryRecords, userContext);
  
  if (resMemOn.baseline.priorityScore === resMemOff.scenario.priorityScore) throw new Error("Test F Failed: Memory toggle had no effect.");
  
  // Test G - Hard Policy Override
  const blockContext = { ...userContext, policy: { ...userContext.policy, blockedClients: ['bad-client'] } };
  const badOpp = { ...opp, clientId: 'bad-client' };
  
  const resHard = simulator.simulate(scenarioBaseline, badOpp, evaluation, explainability, memoryRecords, blockContext);
  if (resHard.baseline.policyDisposition !== 'BLOCK_ACTION') throw new Error("Test G Failed: Hard block bypassed.");

  console.log("ALL TESTS PASSED: phase-g4.16-runtime");
}

runTests().catch(e => { console.error(e); process.exit(1); });
