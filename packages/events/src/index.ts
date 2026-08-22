import { DatabaseSync } from 'node:sqlite';
import { EventBus, EventBusPayload } from '@autogig/core';

export class SQLiteEventBus implements EventBus {
  private db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  async publish(event: EventBusPayload): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO event_queue (
        eventId, eventType, schemaVersion, attempt, payload, status, availableAt, createdAt
      ) VALUES (?, ?, ?, ?, ?, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(eventId) DO NOTHING
    `);
    
    stmt.run(
      event.eventId,
      event.eventType,
      event.schemaVersion || '1.0',
      event.attempt || 1,
      JSON.stringify(event.payload)
    );
  }

  // A local EventBus generally acts more like a Queue if it's processing jobs.
  // We'll implement a polling-based subscribe mechanism for completeness.
  subscribe(eventType: string, handler: (event: EventBusPayload) => Promise<void>): void {
    // In a production setup, workers pull directly from the DB rather than using subscribe.
    // We implement a dummy here since the real logic will be in the opportunity-worker's polling loop.
    console.warn('SQLiteEventBus.subscribe is a stub. Use the worker polling loop instead.');
  }

  // Worker-specific claim method 
  claimPending(): any {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const stmt = this.db.prepare(`
        UPDATE event_queue 
        SET status = 'PROCESSING', attempt = attempt + 1, claimedAt = CURRENT_TIMESTAMP
        WHERE eventId = (
          SELECT eventId FROM event_queue 
          WHERE status = 'PENDING' AND availableAt <= CURRENT_TIMESTAMP
          ORDER BY createdAt ASC LIMIT 1
        )
        RETURNING *
      `);
      const row = stmt.get() as any;
      this.db.exec('COMMIT');
      if (row) {
        row.payload = JSON.parse(row.payload);
      }
      return row || null;
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }
  
  reclaimStale(timeoutMs: number): void {
      const timeoutDate = new Date(Date.now() - timeoutMs).toISOString();
      this.db.exec('BEGIN IMMEDIATE');
      try {
          const stmt = this.db.prepare(`
             UPDATE event_queue
             SET status = 'PENDING', attempt = attempt + 1, claimedAt = NULL
             WHERE status = 'PROCESSING' AND claimedAt <= ?
          `);
          stmt.run(timeoutDate);
          this.db.exec('COMMIT');
      } catch (err) {
          this.db.exec('ROLLBACK');
          throw err;
      }
  }

  acknowledge(eventId: string): void {
    const stmt = this.db.prepare(`
      UPDATE event_queue SET status = 'COMPLETED', processedAt = CURRENT_TIMESTAMP WHERE eventId = ?
    `);
    stmt.run(eventId);
  }

  fail(eventId: string, error: string, maxRetries: number, baseDelay: number): void {
    this.db.exec('BEGIN IMMEDIATE');
    try {
        const getStmt = this.db.prepare('SELECT attempt FROM event_queue WHERE eventId = ?');
        const row = getStmt.get(eventId) as { attempt: number } | undefined;
        if (!row) {
            this.db.exec('COMMIT');
            return;
        }

        const attempt = row.attempt;
        if (attempt >= maxRetries) {
             const updateStmt = this.db.prepare(`
                 UPDATE event_queue SET status = 'DEAD_LETTER', lastError = ?, processedAt = CURRENT_TIMESTAMP WHERE eventId = ?
             `);
             updateStmt.run(error, eventId);
        } else {
             // Exponential backoff
             const delaySeconds = Math.min(baseDelay * Math.pow(2, attempt - 1), 3600);
             const availableAt = new Date(Date.now() + delaySeconds * 1000).toISOString();
             const updateStmt = this.db.prepare(`
                 UPDATE event_queue SET status = 'PENDING', lastError = ?, availableAt = ? WHERE eventId = ?
             `);
             updateStmt.run(error, availableAt, eventId);
        }
        this.db.exec('COMMIT');
    } catch (err) {
        this.db.exec('ROLLBACK');
        throw err;
    }
  }
}

