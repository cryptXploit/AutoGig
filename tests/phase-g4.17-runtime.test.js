
const { DatabaseSync } = require('node:sqlite');
const { DecisionTraceBuilder, LocalDemoIdentityAdapter } = require('@autogig/engine');
const { 
  SQLiteOpportunityRepository, SQLiteAgentRunRepository, SQLiteAgentIterationRepository, 
  SQLiteEvaluationRepository, SQLiteOpportunityStrategyRepository, SQLiteCareerMemoryRepository, 
  SQLiteExecutionRequestRepository, SQLiteExecutionResultRepository, initializeSchema
} = require('@autogig/db');

async function runTests() {
  console.log("=== G4.17 FINAL ACCEPTANCE TESTS ===");

  const path = require('path');
  const fs = require('fs');
  // Use a completely isolated memory/file db that we init from scratch to avoid pollution
  const dbPath = path.resolve(__dirname, '../data/autogig_test17_acceptance.db');
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  
  const db = new DatabaseSync(dbPath);
  initializeSchema(db);

  db.exec(`
    CREATE TABLE IF NOT EXISTS opportunities ( id TEXT PRIMARY KEY, source TEXT NOT NULL, sourceJobId TEXT NOT NULL, canonicalUrl TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, normalizedSkills TEXT, normalizedBudget REAL, deadline DATETIME, client TEXT, provenance TEXT, sourceReliability REAL, publishedAt DATETIME NOT NULL, ingestionTimestamp DATETIME NOT NULL, status TEXT NOT NULL, uncertainDuplicateReason TEXT );
    CREATE TABLE IF NOT EXISTS evaluations ( id TEXT PRIMARY KEY, opportunityId TEXT NOT NULL, overall REAL, technicalFit REAL, evidenceStrength REAL, budgetFit REAL, preferenceFit REAL, scopeClarity REAL, route TEXT, qualificationFlags TEXT, priority INTEGER, deepReasonStatus TEXT, explanations TEXT, clientRiskAssessment TEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, finalScore REAL, historicalIntelligence TEXT );
    CREATE TABLE IF NOT EXISTS opportunity_strategy ( id TEXT PRIMARY KEY, opportunityId TEXT UNIQUE NOT NULL, strategy TEXT NOT NULL, priority TEXT NOT NULL, priorityScore INTEGER NOT NULL, urgency TEXT NOT NULL, timingScore INTEGER NOT NULL, freshnessScore INTEGER NOT NULL, expectedValueScore INTEGER NOT NULL, competitionRiskScore INTEGER NOT NULL, historicalSuccessScore INTEGER NOT NULL, applicationReadinessScore INTEGER NOT NULL, policyReadinessScore INTEGER NOT NULL, reasons TEXT NOT NULL, risks TEXT NOT NULL, confidence INTEGER NOT NULL, generatedAt TEXT NOT NULL, updatedAt TEXT NOT NULL, clientResponsivenessScore INTEGER, recommendedNextAction TEXT );
  `);


  // Repositories
  const oppRepo = new SQLiteOpportunityRepository(db);
  const runRepo = new SQLiteAgentRunRepository(db);
  const iterRepo = new SQLiteAgentIterationRepository(db);
  const evalRepo = new SQLiteEvaluationRepository(db);
  const strategyRepo = new SQLiteOpportunityStrategyRepository(db);
  const memoryRepo = new SQLiteCareerMemoryRepository(db);
  const execReqRepo = new SQLiteExecutionRequestRepository(db);
  const execResultRepo = new SQLiteExecutionResultRepository(db);

  // Setup canonical state
  const oppId = 'opp-accept-1';
  await oppRepo.save({ id: oppId, source: 'TEST', sourceJobId: '1', canonicalUrl: 'http', title: 'Acceptance', description: '', normalizedSkills: [], normalizedBudget: 100, client: {}, publishedAt: new Date('2026-01-01'), ingestionTimestamp: new Date('2026-01-01'), provenance: 'test', sourceReliability: 'HIGH', status: 'OPEN' });

  db.prepare("INSERT INTO evaluations (id, opportunityId, finalScore, explanations, historicalIntelligence, createdAt) VALUES (?, ?, ?, ?, ?, ?)").run(
    'eval-1', oppId, 85, '[]', JSON.stringify({ historicalSuccessAdjustment: 5, historicalConfidence: 0.9, patternConfidence: 0.9, recommendationConfidence: 0.9, successRate: 0.9 }), new Date('2026-01-02').toISOString()
  );

  strategyRepo.save({ id: 'strat-1', opportunityId: oppId, strategy: 'APPLY_NOW', priority: 'HIGH', priorityScore: 95, urgency: 'HIGH', timingScore: 50, freshnessScore: 50, expectedValueScore: 50, competitionRiskScore: 50, historicalSuccessScore: 50, applicationReadinessScore: 50, policyReadinessScore: 50, clientResponsivenessScore: 50, reasons: [], risks: [], confidence: 100, recommendedNextAction: 'X', generatedAt: new Date('2026-01-02'), updatedAt: new Date() });

  const runId = 'run-user-a';
  runRepo.save({ id: runId, opportunityId: oppId, goal: 'APPLY_FOR_OPPORTUNITY', status: 'COMPLETED', currentStep: 'STOP', iteration: 1, maxIterations: 5, startedAt: new Date('2026-01-03'), updatedAt: new Date('2026-01-03'), stopReason: 'GOAL_ACHIEVED', mode: 'AUTONOMOUS' });

  iterRepo.save({
    id: 'iter-a-1', runId, iteration: 1, observedState: { oppId },
    selectedAction: { actionType: 'SEND_PROPOSAL', priority: 'HIGH', expectedOutcome: 'Draft' },
    policyDecision: { id: 'pol-a-1', disposition: 'AUTO_EXECUTE', actionType: 'SEND_PROPOSAL', evaluatedAt: new Date('2026-01-03') },
    readinessDecision: { id: 'read-a-1', state: 'READY_TO_EXECUTE', readinessScore: 100, generatedAt: new Date('2026-01-03') },
    timestamp: new Date('2026-01-03')
  });

  execReqRepo.create({ id: 'req-a', opportunityId: oppId, actionType: 'SEND_PROPOSAL', platform: 'local', payload: {}, policyDecisionId: 'pol-a-1', requestedBy: 'user-a', status: 'COMPLETED', createdAt: new Date('2026-01-04'), updatedAt: new Date('2026-01-04') });
  
  // Create another run/request for User B to test isolation
  execReqRepo.create({ id: 'req-b', opportunityId: oppId, actionType: 'SEND_PROPOSAL', platform: 'local', payload: {}, policyDecisionId: 'pol-b-1', requestedBy: 'user-b', status: 'COMPLETED', createdAt: new Date('2026-01-05'), updatedAt: new Date('2026-01-05') });

  const builder = new DecisionTraceBuilder({
    oppRepo, runRepo, iterationRepo: iterRepo, evalRepo, strategyRepo, memoryRepo,
    userContextLoader: { loadContext: async () => ({}) }, execReqRepo, execResultRepo
  });

  // A. Security Unauthenticated/Wrong User
  try {
     await builder.buildTrace({ opportunityId: oppId, userId: 'user-c' });
     throw new Error("FAIL");
  } catch (err) {
     if (err.message === "FAIL") throw new Error("C. User B viewing User A opportunity -> Should have denied or shown isolated trace. Wait, they both have execReqs on this opportunity!");
  }
  
  // Since both users have ExecReqs on this opportunity, they both technically "own" their respective paths.
  // Actually, our logic says "if any execReqs exist, the user must own at least one". So user-b passes authorization.
  // But User B trace should only include execution matching their user id!
  const traceB = await builder.buildTrace({ opportunityId: oppId, userId: 'user-b' });
  const execB = traceB.steps.filter(s => s.stepType === 'EXECUTION');
  if (execB.length > 0) throw new Error("J/K. Execution request from wrong run/user matched! Iterations are from run-a, but trace matched user-b req!");

  // B. Exact Match
  const traceA = await builder.buildTrace({ opportunityId: oppId, userId: 'user-a' });
  const execA = traceA.steps.filter(s => s.stepType === 'EXECUTION');
  if (execA.length !== 1 || execA[0].id !== 'exe:req-a:1') throw new Error("B. Execution match failed");

  // Zero-write test
  const runsBefore = runRepo.getLatestByOpportunityId(oppId);
  await builder.buildTrace({ opportunityId: oppId, userId: 'user-a' });
  const runsAfter = runRepo.getLatestByOpportunityId(oppId);
  if (JSON.stringify(runsBefore) !== JSON.stringify(runsAfter)) throw new Error("W. Zero-write test failed");

  // Determinism test
  const traceA2 = await builder.buildTrace({ opportunityId: oppId, userId: 'user-a' });
  if (JSON.stringify(traceA) !== JSON.stringify(traceA2)) throw new Error("E. Determinism failed");

  
  // V. Simulation Separation
  const runsBeforeSim = runRepo.getLatestByOpportunityId(oppId);
  const { OpportunitySimulator } = require('@autogig/engine');
  
  // We don't have a fully wired OpportunitySimulator in this test, but if we did we would call simulate().
  // Since we only need to test the trace doesn't leak simulation runs...
  // A trace shouldn't pick up simulation data.
  // We'll mock a simulation inserting an execution request under a different runId.
  execReqRepo.create({ id: 'req-sim', opportunityId: oppId, actionType: 'SEND_PROPOSAL', platform: 'local', payload: {}, policyDecisionId: 'pol-sim-1', requestedBy: 'user-a', status: 'COMPLETED', createdAt: new Date('2026-01-06'), updatedAt: new Date('2026-01-06') });
  
  const traceA3 = await builder.buildTrace({ opportunityId: oppId, userId: 'user-a' });
  // It shouldn't include req-sim because it's not tied to any canonical iter for run-user-a
  const simMatch = traceA3.steps.find(s => s.id.includes('req-sim'));
  if (simMatch) throw new Error("V. Simulation Separation failed: Trace picked up unconnected execution request");
  
  
  // X. API DTO Allowlist
  const expectedSummaryKeys = ['opportunityId', 'finalAction', 'finalStrategy', 'policyDisposition', 'readinessState', 'iterations', 'executionStatus', 'stopReason', 'traceModelVersion'];
  const actualSummaryKeys = Object.keys(traceA3.summary);
  for (const k of actualSummaryKeys) {
     if (!expectedSummaryKeys.includes(k)) throw new Error("X. DTO Allowlist failed: Unknown key " + k);
  }
  
  const expectedStepKeys = ['id', 'runId', 'opportunityId', 'iteration', 'stepType', 'status', 'title', 'summary', 'reason', 'timestamp', 'timestampSource', 'inputs', 'outputs', 'sourceReferences', 'provenanceClass', 'epistemicStatus'];
  for (const step of traceA3.steps) {
     for (const k of Object.keys(step)) {
        if (!expectedStepKeys.includes(k)) throw new Error("X. DTO Allowlist failed: Unknown key " + k + " on step");
     }
  }

  console.log("ALL ACCEPTANCE TESTS PASSED");
   
   
}

runTests().catch(e => { console.error(e); process.exit(1); });
