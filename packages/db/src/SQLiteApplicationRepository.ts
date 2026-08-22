import { DatabaseSync } from 'node:sqlite';
import { ApplicationIntelligence } from '@autogig/core';

export class SQLiteApplicationRepository {
  constructor(private db: DatabaseSync) {}

  save(app: ApplicationIntelligence): void {
    const stmt = this.db.prepare(`
      INSERT INTO applications (
        id, opportunityId, proposalId, tailoredResume, screeningAnswers,
        suggestedRate, suggestedTimeline, readinessScore, recommendation, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      app.id,
      app.opportunityId,
      app.proposalId || null,
      JSON.stringify(app.tailoredResume),
      JSON.stringify(app.screeningAnswers),
      app.suggestedRate,
      app.suggestedTimeline,
      app.readinessScore,
      app.recommendation,
      app.createdAt.toISOString()
    );
  }

  findByOpportunityId(opportunityId: string): ApplicationIntelligence | null {
    const row: any = this.db.prepare(`SELECT * FROM applications WHERE opportunityId = ? ORDER BY createdAt DESC LIMIT 1`).get(opportunityId);
    if (!row) return null;
    return {
      id: row.id,
      opportunityId: row.opportunityId,
      proposalId: row.proposalId,
      tailoredResume: JSON.parse(row.tailoredResume),
      screeningAnswers: JSON.parse(row.screeningAnswers),
      suggestedRate: row.suggestedRate,
      suggestedTimeline: row.suggestedTimeline,
      readinessScore: row.readinessScore,
      recommendation: row.recommendation,
      createdAt: new Date(row.createdAt)
    };
  }
}
