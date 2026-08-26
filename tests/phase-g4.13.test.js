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
  
  const mockPolicyRepo = {
     findByOpportunityId: (id) => ({ disposition: id === 'opp-blocked' ? 'BLOCK_ACTION' : (id === 'opp-manual' ? 'REQUIRE_HUMAN_APPROVAL' : 'AUTO_EXECUTE') })
  };
  
  const mockReadinessRepo = {
     findByOpportunityId: (id) => ({ state: id === 'opp-not-ready' ? 'BLOCKED' : 'READY_TO_DRAFT' })
  };
  
  const adapter = new LocalDemoPlatformAdapter({});
  
  const orchestrator = new ActionExecutionOrchestrator({
    requestRepo: reqRepo, resultRepo, auditRepo, policyRepo: mockPolicyRepo, readinessRepo: mockReadinessRepo, platformAdapter: adapter
  });

  console.log("TEST A: Valid auto-executable action");
  const req1 = { id: 'req1', opportunityId: 'opp1', actionType: 'SEND_PROPOSAL', platform: 'local-demo', payload: {}, requestedBy: 'SYSTEM', status: 'DRAFT', createdAt: new Date(), updatedAt: new Date() };
  reqRepo.create(req1);
  let res1 = await orchestrator.processRequest(req1);
  if (res1.status !== 'EXECUTED') throw new Error('Expected EXECUTED, got ' + res1.status);
  
  console.log("TEST B: Approval-required action");
  const req2 = { id: 'req2', opportunityId: 'opp-manual', actionType: 'SEND_PROPOSAL', platform: 'local-demo', payload: {}, requestedBy: 'SYSTEM', status: 'DRAFT', createdAt: new Date(), updatedAt: new Date() };
  reqRepo.create(req2);
  let res2 = await orchestrator.processRequest(req2);
  if (res2.status !== 'PENDING_APPROVAL') throw new Error('Expected PENDING_APPROVAL, got ' + res2.status);
  
  console.log("TEST B.2: Approve and execute");
  orchestrator.approve(req2);
  let res2_after = await orchestrator.processRequest(req2);
  if (res2_after.status !== 'EXECUTED') throw new Error('Expected EXECUTED, got ' + res2_after.status);

  console.log("TEST C: Policy BLOCK_ACTION");
  const req3 = { id: 'req3', opportunityId: 'opp-blocked', actionType: 'SEND_PROPOSAL', platform: 'local-demo', payload: {}, requestedBy: 'SYSTEM', status: 'DRAFT', createdAt: new Date(), updatedAt: new Date() };
  reqRepo.create(req3);
  let res3 = await orchestrator.processRequest(req3);
  if (res3.status !== 'BLOCKED') throw new Error('Expected BLOCKED, got ' + res3.status);

  console.log("TEST D: ExecutionReadiness BLOCKED");
  const req4 = { id: 'req4', opportunityId: 'opp-not-ready', actionType: 'SEND_PROPOSAL', platform: 'local-demo', payload: {}, requestedBy: 'SYSTEM', status: 'DRAFT', createdAt: new Date(), updatedAt: new Date() };
  reqRepo.create(req4);
  let res4 = await orchestrator.processRequest(req4);
  if (res4.status !== 'BLOCKED') throw new Error('Expected BLOCKED, got ' + res4.status);
  
  console.log("TEST E: Illegal status transition");
  try {
     req1.status = 'EXECUTED';
     orchestrator.reject(req1);
     throw new Error('Should have thrown on EXECUTED -> CANCELLED');
  } catch(e) {
     if(!e.message.includes('Illegal')) throw e;
  }
  
  console.log("TEST H: Idempotency check");
  let res1_dup = await orchestrator.processRequest(req1);
  if (res1_dup.status !== 'EXECUTED') throw new Error('Should have returned existing result');
  
  console.log("TEST K: Audit Trail");
  const audits = auditRepo.findByOpportunityId('opp1');
  if (audits.length < 2) throw new Error('Missing audit trails');

  console.log("ALL TESTS PASSED: phase-g4.13");
}

run().catch(console.error);
