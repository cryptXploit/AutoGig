import { DatabaseSync } from 'node:sqlite';
import { RunRepository, RunDetails } from '@autogig/core';

export class SQLiteRunRepository implements RunRepository {
  constructor(private db: DatabaseSync) {}

  async saveRun(details: RunDetails): Promise<void> {
    this.db.exec('BEGIN IMMEDIATE'); try {
      // Ensure run exists
      this.db.prepare(`
        INSERT INTO runs (id, status, startedAt) VALUES (?, 'IN_PROGRESS', CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO NOTHING
      `).run(details.runId);
      
      this.db.prepare(`
        INSERT INTO run_stages (runId, stage, status, latency, retryCount, error)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        details.runId, details.stage, details.status, details.latency, 
        details.retryCount || 0, details.errors ? JSON.stringify(details.errors) : null
      );
    } catch (e) { this.db.exec('ROLLBACK'); throw e; } this.db.exec('COMMIT');
  }
}


