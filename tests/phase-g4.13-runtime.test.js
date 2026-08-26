const { DatabaseSync } = require('node:sqlite');
const { ActionExecutionOrchestrator, LocalDemoPlatformAdapter } = require('@autogig/engine');
const { SQLiteExecutionRequestRepository, SQLiteExecutionResultRepository, SQLiteExecutionAuditRepository } = require('@autogig/db');
const { ActionType } = require('@autogig/core');

async function run() {
  const db = new DatabaseSync(':memory:');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS execution_requests (
      id TEXT PRIMARY KEY, opportunityId TEXT NOT NULL, actionType TEXT NOT NULL, platform TEXT NOT NULL,
      payload TEXT, policyDecisionId TEXT, executionReadinessId TEXT, requestedBy TEXT, status TEXT NOT NULL, createdAt TEXT, updatedAt TEXT
    );
    CREATE TABLE IF NOT EXISTS execution_results (
      id TEXT PRIMARY KEY, executionRequestId TEXT NOT NULL, success INTEGER NOT NULL, status TEXT NOT NULL,
      externalReference TEXT, message TEXT, failureReason TEXT, metadata TEXT, executedAt TEXT
    );
    CREATE TABLE IF NOT EXISTS execution_audit (
      id TEXT PRIMARY KEY, executionRequestId TEXT NOT NULL, opportunityId TEXT NOT NULL, previousStatus TEXT,
      newStatus TEXT NOT NULL, reason TEXT, actor TEXT NOT NULL, timestamp TEXT
    );
  `);

  const reqRepo = new SQLiteExecutionRequestRepository(db);
  const resultRepo = new SQLiteExecutionResultRepository(db);
  const auditRepo = new SQLiteExecutionAuditRepository(db);
  
  const mockPolicyRepo = { findByOpportunityId: (id) => ({ disposition: 'REQUIRE_HUMAN_APPROVAL' }) };
  const mockReadinessRepo = { findByOpportunityId: (id) => ({ state: 'READY_FOR_HUMAN_APPROVAL' }) };
  
  const adapter = new LocalDemoPlatformAdapter({});
  const orchestrator = new ActionExecutionOrchestrator({
    requestRepo: reqRepo, resultRepo, auditRepo, policyRepo: mockPolicyRepo, readinessRepo: mockReadinessRepo, platformAdapter: adapter
  });

  const req = { id: 'req1', opportunityId: 'opp1', actionType: 'SEND_PROPOSAL', platform: 'local-demo', payload: {}, requestedBy: 'SYSTEM', status: 'DRAFT', createdAt: new Date(), updatedAt: new Date() };
  reqRepo.create(req);
  
  console.log('1. Processing Request');
  let res1 = await orchestrator.processRequest(req);
  if (res1.status !== 'PENDING_APPROVAL') throw new Error('Failed to stop for approval');
  
  console.log('2. Approving Request');
  orchestrator.approve(req);
  
  console.log('3. Executing Request');
  let res2 = await orchestrator.processRequest(req);
  if (res2.status !== 'EXECUTED') throw new Error('Execution failed');
  
  console.log('4. Verifying DB state');
  const storedReq = reqRepo.findById('req1');
  if (storedReq.status !== 'EXECUTED') throw new Error('DB Request state wrong');
  
  const storedRes = resultRepo.findByRequestId('req1');
  if (!storedRes.success) throw new Error('DB Result success wrong');
  
  const audits = auditRepo.findByOpportunityId('opp1');
  if (audits.length < 3) throw new Error('Audit trail incomplete');
  
  console.log("ALL TESTS PASSED: phase-g4.13-runtime");
}

run().catch(console.error);
