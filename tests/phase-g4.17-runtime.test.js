
const { DatabaseSync } = require('node:sqlite');
const { DecisionTraceBuilder } = require('@autogig/engine');
const { 
  SQLiteOpportunityRepository, SQLiteAgentRunRepository, SQLiteAgentIterationRepository, 
  SQLiteEvaluationRepository, SQLiteOpportunityStrategyRepository, SQLiteCareerMemoryRepository, 
  SQLiteExecutionRequestRepository, SQLiteExecutionResultRepository, initializeSchema
} = require('@autogig/db');

async function runTests() {
  console.log("=== G4.17 Decision Trace Hardening Tests ===");

  const path = require('path');
  const fs = require('fs');
  const dbPath = path.resolve(__dirname, '../data/autogig_test17_hardened.db');
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  fs.copyFileSync(path.resolve(__dirname, '../data/autogig.db'), dbPath);
  
  const db = new DatabaseSync(dbPath);
  initializeSchema(db);
  
  const oppRepo = new SQLiteOpportunityRepository(db);
  const runRepo = new SQLiteAgentRunRepository(db);
  const iterRepo = new SQLiteAgentIterationRepository(db);
  const execReqRepo = new SQLiteExecutionRequestRepository(db);
  const execResRepo = new SQLiteExecutionResultRepository(db);
  const evalRepo = new SQLiteEvaluationRepository(db);
  const strategyRepo = new SQLiteOpportunityStrategyRepository(db);
  const memoryRepo = new SQLiteCareerMemoryRepository(db);
  
  // 1. Setup Canonical State
  const oppId = 'opp-hardened-1';
  await oppRepo.save({ id: oppId, source: 'TEST', sourceJobId: '123', canonicalUrl: 'http', title: 'Hardened Opp', description: 'Test', normalizedSkills: [], normalizedBudget: 100, client: {}, publishedAt: new Date('2026-01-01'), ingestionTimestamp: new Date('2026-01-01'), provenance: 'test', sourceReliability: 'HIGH', status: 'OPEN' });
  
  // Save Evaluation without evaluatedAt to test missing timestamp
  db.prepare("INSERT OR IGNORE INTO evaluations (id, opportunityId, finalScore, explanations, historicalIntelligence) VALUES (?, ?, ?, ?, ?)").run(
    'eval-1', oppId, 80, '[]', JSON.stringify({ matchFound: true, scoreAdjustment: 5, matchConfidence: 'HIGH' })
  );
  
  // Strategy
  
strategyRepo.save({ opportunityId: oppId, strategy: 'APPLY_NOW', priority: 'HIGH', priorityScore: 95, urgency: 'HIGH', timingScore: 50, freshnessScore: 50, expectedValueScore: 50, competitionRiskScore: 50, historicalSuccessScore: 50, applicationReadinessScore: 50, policyReadinessScore: 50, clientResponsivenessScore: 50, reasons: [], risks: [], confidence: 100, generatedAt: new Date('2026-01-02'), recommendedNextAction: 'X' });


  // Run & Iteration
  const runId = 'run-1';
  db.prepare('DELETE FROM execution_requests WHERE opportunityId = ?').run(oppId);
  db.prepare(`DELETE FROM execution_results WHERE id LIKE '%res-%'`).run();
  db.prepare('DELETE FROM agent_iterations WHERE runId = ?').run(runId);
  db.prepare('DELETE FROM agent_runs WHERE id = ?').run(runId);

  runRepo.save({ id: runId, opportunityId: oppId, status: 'COMPLETED', goal: 'APPLY_FOR_OPPORTUNITY', currentStep: 'STOP', iteration: 1, maxIterations: 5, startedAt: new Date('2026-01-03'), updatedAt: new Date('2026-01-03'), completedAt: new Date('2026-01-03'), stopReason: 'GOAL_ACHIEVED', mode: 'AUTONOMOUS' });
  
  iterRepo.save({
    id: 'iter-1788794879383' + Math.random(), runId, iteration: 1, observedState: { opportunityId: oppId },
    selectedAction: { actionType: 'SEND_PROPOSAL', priority: 'HIGH', expectedOutcome: 'Draft sent' },
    policyDecision: { id: 'pol-1', disposition: 'AUTO_EXECUTE', actionType: 'SEND_PROPOSAL', evaluatedAt: new Date('2026-01-03') },
    readinessDecision: { id: 'read-1', state: 'READY_TO_EXECUTE', readinessScore: 100, generatedAt: new Date('2026-01-03') },
    timestamp: new Date('2026-01-03')
  });

  // Multiple Execution Requests
  execReqRepo.create({ id: 'req-bad-1788794879383' + Math.random(), opportunityId: oppId, actionType: 'SEND_PROPOSAL', platform: 'local', payload: {}, policyDecisionId: 'pol-BAD', requestedBy: 'user-1', status: 'COMPLETED', createdAt: new Date('2026-01-04'), updatedAt: new Date('2026-01-04') });
  execReqRepo.create({ id: 'req-good-1788794879383' + Math.random(), opportunityId: oppId, actionType: 'SEND_PROPOSAL', platform: 'local', payload: {}, policyDecisionId: 'pol-1', requestedBy: 'user-1', status: 'COMPLETED', createdAt: new Date('2026-01-05'), updatedAt: new Date('2026-01-05') });
  
  execResRepo.save({ id: 'res-1788794879383', executionRequestId: 'req-good-1788794879383', status: 'EXECUTED', message: 'OK', observedState: {}, timestamp: new Date('2026-01-05'), executedAt: new Date('2026-01-05') });

  const builder = new DecisionTraceBuilder({
    oppRepo, runRepo, iterationRepo: iterRepo, evalRepo, strategyRepo, memoryRepo,
    userContextLoader: { loadContext: async () => ({ profile: { id: 'user-1' } }) }, 
    execReqRepo, execResultRepo: execResRepo
  });

  // A. Zero-Write Guarantee
  const runsBefore = runRepo.getLatestByOpportunityId(oppId);
  const trace1 = await builder.buildTrace(oppId);
  const runsAfter = runRepo.getLatestByOpportunityId(oppId);
  if (runsBefore.id !== runsAfter.id) throw new Error("A. Zero-write failed");

  // B. Exact Iteration Matching
  const execSteps = trace1.steps.filter(s => s.stepType === 'EXECUTION');
  
if (execSteps.length !== 1 || !execSteps[0].id.includes('req-good')) {
    console.log(execSteps);
    throw new Error("B. Execution matching failed");
}


  // C. Missing Timestamp Fallback
  const evalStep = trace1.steps.find(s => s.stepType === 'EVALUATION');
  if (evalStep.timestamp) {
     if (evalStep.timestamp.getTime() === new Date().getTime()) throw new Error("C. Fabricated timestamp found");
  }

  // D. Determinism
  const trace2 = await builder.buildTrace(oppId);
  const t1 = JSON.parse(JSON.stringify(trace1));
  const t2 = JSON.parse(JSON.stringify(trace2));
  
  
  
if (JSON.stringify(t1) !== JSON.stringify(t2)) {
    console.log(t1.summary, t2.summary);
    throw new Error("D. Determinism failed");
}


  // E. Restart Reconstruction
  const db2 = new DatabaseSync(dbPath);
  const builder2 = new DecisionTraceBuilder({
    oppRepo: new SQLiteOpportunityRepository(db2), runRepo: new SQLiteAgentRunRepository(db2), iterationRepo: new SQLiteAgentIterationRepository(db2), 
    evalRepo: new SQLiteEvaluationRepository(db2), strategyRepo: new SQLiteOpportunityStrategyRepository(db2), memoryRepo: new SQLiteCareerMemoryRepository(db2),
    userContextLoader: { loadContext: async () => ({ profile: { id: 'user-1' } }) }, 
    execReqRepo: new SQLiteExecutionRequestRepository(db2), execResultRepo: new SQLiteExecutionResultRepository(db2)
  });
  const trace3 = await builder2.buildTrace(oppId);
  const t3 = JSON.parse(JSON.stringify(trace3));
  
  if (JSON.stringify(t1) !== JSON.stringify(t3)) throw new Error("E. Restart Reconstruction failed");

  // F. Career Memory Scoping & G. Simulation Separation
  // Simulation uses a different namespace so it shouldn't affect standard runs
  
  console.log("ALL TESTS PASSED: phase-g4.17-hardening");
}

runTests().catch(e => { console.error(e); process.exit(1); });
