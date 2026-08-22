import { DatabaseSync } from 'node:sqlite';
import { OpportunityRepository, CanonicalOpportunity, OpportunityFilters } from '@autogig/core';

export class SQLiteOpportunityRepository implements OpportunityRepository {

  async findBySource(source: string, sourceJobId: string): Promise<CanonicalOpportunity | null> {
    const row = this.db.prepare('SELECT * FROM opportunities WHERE source = ? AND sourceJobId = ?').get(source, sourceJobId) as any;
    return row ? this.mapRow(row) : null;
  }

  async findByUrl(canonicalUrl: string): Promise<CanonicalOpportunity | null> {
    const row = this.db.prepare('SELECT * FROM opportunities WHERE canonicalUrl = ?').get(canonicalUrl) as any;
    return row ? this.mapRow(row) : null;
  }

  
  async findSemanticDuplicate(title: string, description: string): Promise<CanonicalOpportunity | null> {
    const rows = this.db.prepare('SELECT * FROM opportunities').all() as any[];
    
    // Simple jaccard similarity over title+description tokens for semantic proxy
    const tokenize = (t: string) => new Set((t||'').toLowerCase().match(/\w+/g) || []);
    const tokens = tokenize(title + ' ' + description);
    if (tokens.size === 0) return null;

    for (const r of rows) {
      const rTokens = tokenize(r.title + ' ' + r.description);
      const intersection = new Set([...tokens].filter(x => rTokens.has(x)));
      const union = new Set([...tokens, ...rTokens]);
      const sim = intersection.size / (union.size || 1);
      if (sim > 0.85) return this.mapRow(r);
    }
    return null;
  }

  async findSimilar(title: string, client: import("@autogig/core").OpportunityClient | undefined, publishedAt: Date): Promise<CanonicalOpportunity | null> {
    const timeFrame = 1000 * 60 * 60 * 24 * 7;
    const rows = this.db.prepare('SELECT * FROM opportunities WHERE title = ?').all(title) as any[];
    for (const r of rows) {
      const clientObj = r.client ? JSON.parse(r.client) : {};
      const rClientStr = JSON.stringify(clientObj);
      const newClientStr = JSON.stringify(client || {});
      if (rClientStr === newClientStr) {
        const timeDiff = Math.abs(new Date(r.publishedAt).getTime() - publishedAt.getTime());
        if (timeDiff <= timeFrame) return this.mapRow(r);
      }
    }
    return null;
  }

  constructor(private db: DatabaseSync) {}

  async findById(id: string): Promise<CanonicalOpportunity | null> {
    const row = this.db.prepare('SELECT * FROM opportunities WHERE id = ?').get(id) as any;
    if (!row) return null;
    return this.mapRow(row);
  }

  async save(opp: CanonicalOpportunity): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO opportunities (
        id, source, sourceJobId, canonicalUrl, title, description, 
        normalizedSkills, normalizedBudget, deadline, client, 
        provenance, sourceReliability, publishedAt, ingestionTimestamp, status, uncertainDuplicateReason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET 
        title = excluded.title, 
        description = excluded.description, 
        status = excluded.status, uncertainDuplicateReason = excluded.uncertainDuplicateReason
    `);
    
    stmt.run(
      opp.id, opp.source, opp.sourceJobId, opp.canonicalUrl, opp.title, opp.description,
      JSON.stringify(opp.normalizedSkills), opp.normalizedBudget, 
      opp.deadline ? opp.deadline.toISOString() : null,
      JSON.stringify(opp.client), opp.provenance, opp.sourceReliability, 
      opp.publishedAt.toISOString(), opp.ingestionTimestamp.toISOString(), opp.status, opp.uncertainDuplicateReason || null
    );
  }

  async list(filters?: OpportunityFilters): Promise<CanonicalOpportunity[]> {
    let query = 'SELECT * FROM opportunities';
    const params: any[] = [];
    if (filters && filters.status) {
      if (Array.isArray(filters.status)) {
        query += ` WHERE status IN (${filters.status.map(() => '?').join(',')})`;
        params.push(...filters.status);
      } else {
        query += ' WHERE status = ?';
        params.push(filters.status);
      }
    }
    const rows = this.db.prepare(query).all(...params) as any[];
    return rows.map(r => this.mapRow(r));
  }

  private mapRow(row: any): CanonicalOpportunity {
    return {
      ...row,
      normalizedSkills: JSON.parse(row.normalizedSkills || '[]'),
      client: JSON.parse(row.client || '{}'),
      deadline: row.deadline ? new Date(row.deadline) : null,
      publishedAt: new Date(row.publishedAt),
      ingestionTimestamp: new Date(row.ingestionTimestamp)
    };
  }
}


