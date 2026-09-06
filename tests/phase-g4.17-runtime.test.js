const { DatabaseSync } = require('node:sqlite');
const { AgentController, DecisionTraceBuilder, UserIntelligenceContextLoader, OpportunityStrategyEngine, ActionPolicyEngine, ExecutionReadinessEngine } = require('@autogig/engine');
const { 
  SQLiteOpportunityRepository, SQLiteAgentRunRepository, SQLiteAgentIterationRepository, 
  SQLiteEvaluationRepository, SQLiteOpportunityStrategyRepository, SQLiteCareerMemoryRepository, 
  SQLiteExecutionRequestRepository, SQLiteExecutionResultRepository, SQLiteProfileRepository, 
  SQLiteUserPolicyRepository, SQLiteUserEvidenceRepository, initializeSchema,
  SQLiteDecisionExplainabilityRepository
} = require('@autogig/db');
const { AgentGoal, ActionType } = require('@autogig/core');

async function runTests() {
  console.log("=== G4.17 Decision Trace & Explainability ===");

  const path = require('path');
  const fs = require('fs');
  const dbPath = path.resolve(__dirname, '../data/autogig_test17.db');
  const srcPath = path.resolve(__dirname, '../data/autogig.db');
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  fs.copyFileSync(srcPath, dbPath);
  
  const db = new DatabaseSync(dbPath);
  initializeSchema(db);
  
  const oppRepo = new SQLiteOpportunityRepository(db);
  const opps = await oppRepo.list(); 
  const testOpp = opps[0];
  if(!testOpp) throw new Error('No opp');
  const oppId = testOpp.id;

  const profileRepo = new SQLiteProfileRepository(db);
  const policyRepo = new SQLiteUserPolicyRepository(db);
  const evRepo = new SQLiteUserEvidenceRepository(db);
  const runRepo = new SQLiteAgentRunRepository(db);
  const iterRepo = new SQLiteAgentIterationRepository(db);
  const execReqRepo = new SQLiteExecutionRequestRepository(db);
  const execResRepo = new SQLiteExecutionResultRepository(db);
  
  const evalRepo = new SQLiteEvaluationRepository(db);
  const explainRepo = new SQLiteDecisionExplainabilityRepository(db);

  
db.prepare("UPDATE opportunity_strategy SET strategy = 'APPLY_NOW' WHERE opportunityId = ?").run(oppId);
db.prepare('UPDATE evaluations SET historicalIntelligence = ? WHERE opportunityId = ?').run(JSON.stringify({ matchFound: true, similarOpportunities: ['opp-x'], scoreAdjustment: 5, matchConfidence: 'HIGH' }), oppId);

  const strategyRepo = new SQLiteOpportunityStrategyRepository(db);
  const memoryRepo = new SQLiteCareerMemoryRepository(db);
  
  
  
  const userLoader = new UserIntelligenceContextLoader(
    { findById: (id) => ({ id, name: 'Demo' }) },
    { findById: (id) => ({ minimumRate: 30, blockedClients: [], autonomyLevel: 'FULL_AUTONOMY' }) },
    { findByUserId: (id) => [] },
    { validate: () => [] }
  );



  const controller = new AgentController({
    runRepo, iterationRepo: iterRepo, execReqRepo, execResRepo, 
    policyRepo: { save: () => {}, getLatestByOpportunityAndAction: () => null },
    readinessRepo: { save: () => {}, findByOpportunityId: () => null },
    memoryRepo,
    policyEngine: { evaluateAction: () => ({ disposition: 'AUTO_EXECUTE', actionType: 'SEND_PROPOSAL' }) },
    strategyEngine: { evaluate: () => ({ strategy: 'APPLY_NOW', priorityScore: 100, confidence: 100 }) },
    readinessEngine: { evaluate: () => ({ state: 'READY_TO_EXECUTE', readinessScore: 100 }) },
    orchestrator: { processRequest: async (req) => {
       
       const res = { id: 'res-1', executionRequestId: req.id, success: true, status: 'SUCCESS', message: 'OK', executedAt: new Date() };
       execResRepo.save(res);
       execReqRepo.updateStatus(req.id, 'COMPLETED');
       return res;
    } },
    oppRepo, evalRepo, explainRepo,
    userContextLoader: { loadContext: async () => userLoader.load('user-1') }
  });

  await controller.startRun(oppId, 'APPLY_FOR_OPPORTUNITY');
  await controller.tick(oppId);

  const builder = new DecisionTraceBuilder({
    oppRepo, runRepo, iterationRepo: iterRepo, evalRepo, strategyRepo, memoryRepo,
    userContextLoader: { loadContext: async () => userLoader.load('user-1') }, execReqRepo, execResultRepo: execResRepo
  });

  const trace = await builder.buildTrace(oppId);

  if (!trace.steps || trace.steps.length === 0) throw new Error("Test A Failed: No steps generated.");
  const types = trace.steps.map(s => s.stepType);
  if (!types.includes('OBSERVATION')) throw new Error("Test A Failed: Missing OBSERVATION.");
  if (!types.includes('EVALUATION')) throw new Error("Test A Failed: Missing EVALUATION.");
  if (!types.includes('HISTORICAL_INTELLIGENCE')) { throw new Error("Test A Failed: Missing HISTORICAL_INTELLIGENCE."); }
  if (!types.includes('STRATEGY')) throw new Error("Test A Failed: Missing STRATEGY.");
  if (!types.includes('POLICY')) { throw new Error("Test A Failed: Missing POLICY."); }
  if (!types.includes('READINESS')) throw new Error("Test A Failed: Missing READINESS.");
  
  const runsBefore = runRepo.getLatestByOpportunityId(oppId);
  await builder.buildTrace(oppId);
  const runsAfter = runRepo.getLatestByOpportunityId(oppId);
  if (runsBefore.id !== runsAfter.id) throw new Error("Test B Failed: Re-building trace mutated run repo!");

  const trace2 = await builder.buildTrace(oppId);
  if (trace.steps.length !== trace2.steps.length || trace.summary.iterations !== trace2.summary.iterations) throw new Error("Test C Failed: Trace is not deterministic.");

  console.log("ALL TESTS PASSED: phase-g4.17-runtime");
}

runTests().catch(e => { console.error(e); process.exit(1); });
