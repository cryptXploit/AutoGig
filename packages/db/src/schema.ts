import { DatabaseSync } from 'node:sqlite';

export function initializeSchema(db: DatabaseSync): void {

  db.exec(`
    CREATE TABLE IF NOT EXISTS agent_runs (
      id TEXT PRIMARY KEY,
      opportunityId TEXT NOT NULL,
      goal TEXT NOT NULL,
      status TEXT NOT NULL,
      currentStep TEXT NOT NULL,
      iteration INTEGER NOT NULL,
      maxIterations INTEGER NOT NULL,
      stopReason TEXT,
      startedAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      completedAt TEXT
    );
    CREATE TABLE IF NOT EXISTS agent_iterations (
      id TEXT PRIMARY KEY,
      runId TEXT NOT NULL,
      iteration INTEGER NOT NULL,
      observedState TEXT NOT NULL,
      selectedAction TEXT,
      policyDecision TEXT,
      readinessDecision TEXT,
      executionDecision TEXT,
      result TEXT,
      stopReason TEXT,
      timestamp TEXT NOT NULL
    );
  
CREATE TABLE IF NOT EXISTS execution_requests (
      id TEXT PRIMARY KEY,
      opportunityId TEXT NOT NULL,
      actionType TEXT NOT NULL,
      platform TEXT NOT NULL,
      payload TEXT,
      policyDecisionId TEXT,
      executionReadinessId TEXT,
      requestedBy TEXT,
      status TEXT NOT NULL,
      createdAt TEXT,
      updatedAt TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS execution_results (
      id TEXT PRIMARY KEY,
      executionRequestId TEXT NOT NULL,
      success INTEGER NOT NULL,
      status TEXT NOT NULL,
      externalReference TEXT,
      message TEXT,
      failureReason TEXT,
      metadata TEXT,
      executedAt TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS execution_audit (
      id TEXT PRIMARY KEY,
      executionRequestId TEXT NOT NULL,
      opportunityId TEXT NOT NULL,
      previousStatus TEXT,
      newStatus TEXT NOT NULL,
      reason TEXT,
      actor TEXT NOT NULL,
      timestamp TEXT
    )
  `);


  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_agent_runs_opp_id ON agent_runs (opportunityId);
    CREATE INDEX IF NOT EXISTS idx_agent_iterations_run_id ON agent_iterations (runId);
  `);

}