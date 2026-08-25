import { DatabaseSync } from 'node:sqlite';
import { OutcomeRecord } from '@autogig/core';

export class SQLiteOutcomeRepository {
  constructor(private db: DatabaseSync) {}

  save(outcome: OutcomeRecord): void {
    const stmt = this.db.prepare(`
      INSERT INTO outcomes (
        id, opportunityId, status, clientResponse, feedback, createdAt,
        clientFeedback, hired, paymentSuccess, rating, responseTimeDays,
        proposalAccepted, conversationAccepted, realizedRate, realizedTimeline,
        failureReason, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status=excluded.status,
        clientResponse=excluded.clientResponse,
        feedback=excluded.feedback,
        clientFeedback=excluded.clientFeedback,
        hired=excluded.hired,
        paymentSuccess=excluded.paymentSuccess,
        rating=excluded.rating,
        responseTimeDays=excluded.responseTimeDays,
        proposalAccepted=excluded.proposalAccepted,
        conversationAccepted=excluded.conversationAccepted,
        realizedRate=excluded.realizedRate,
        realizedTimeline=excluded.realizedTimeline,
        failureReason=excluded.failureReason,
        metadata=excluded.metadata
    `);
    stmt.run(
      outcome.id,
      outcome.opportunityId,
      outcome.status,
      outcome.clientResponse || null,
      outcome.feedback || null,
      outcome.createdAt.toISOString(),
      outcome.clientFeedback || null,
      outcome.hired ? 1 : 0,
      outcome.paymentSuccess ? 1 : 0,
      outcome.rating || null,
      outcome.responseTimeDays || null,
      outcome.proposalAccepted ? 1 : 0,
      outcome.conversationAccepted ? 1 : 0,
      outcome.realizedRate || null,
      outcome.realizedTimeline || null,
      outcome.failureReason || null,
      outcome.metadata ? JSON.stringify(outcome.metadata) : null
    );
  }

  findByOpportunityId(opportunityId: string): OutcomeRecord | null {
    const row = this.db.prepare('SELECT * FROM outcomes WHERE opportunityId = ?').get(opportunityId) as any;
    if (!row) return null;
    return this.mapRow(row);
  }

  findAll(): OutcomeRecord[] {
    const rows = this.db.prepare('SELECT * FROM outcomes ORDER BY createdAt DESC').all() as any[];
    return rows.map(r => this.mapRow(r));
  }

  private mapRow(row: any): OutcomeRecord {
    return {
      id: row.id,
      opportunityId: row.opportunityId,
      status: row.status,
      clientResponse: row.clientResponse,
      feedback: row.feedback,
      createdAt: new Date(row.createdAt),
      clientFeedback: row.clientFeedback,
      hired: row.hired === 1,
      paymentSuccess: row.paymentSuccess === 1,
      rating: row.rating,
      responseTimeDays: row.responseTimeDays,
      proposalAccepted: row.proposalAccepted === 1,
      conversationAccepted: row.conversationAccepted === 1,
      realizedRate: row.realizedRate,
      realizedTimeline: row.realizedTimeline,
      failureReason: row.failureReason,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    };
  }
}