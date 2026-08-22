const fs = require('fs');

// 1. Update evaluations schema
let schemaPath = 'packages/db/src/schema.ts';
let schema = fs.readFileSync(schemaPath, 'utf8');

schema = schema.replace(/CREATE TABLE IF NOT EXISTS evaluations \([\s\S]*?\);/, `CREATE TABLE IF NOT EXISTS evaluations (
      id TEXT PRIMARY KEY,
      opportunityId TEXT NOT NULL,
      overall REAL,
      technicalFit REAL,
      evidenceStrength REAL,
      budgetFit REAL,
      preferenceFit REAL,
      scopeClarity REAL,
      route TEXT,
      qualificationFlags TEXT,
      priority INTEGER,
      deepReasonStatus TEXT,
      explanations TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(opportunityId) REFERENCES opportunities(id)
    );`);
fs.writeFileSync(schemaPath, schema);
if (fs.existsSync('packages/db/dist/schema.js')) fs.unlinkSync('packages/db/dist/schema.js');

// 2. Update Repositories
let repoPath = 'packages/db/src/repositories/SQLiteOtherRepositories.ts';
let repoCode = `
import { DatabaseSync } from 'node:sqlite';
import { Profile, Preference } from '@autogig/core';

export class SQLiteProfileRepository {
  constructor(private db: DatabaseSync) {}
  async getProfile(userId: string): Promise<Profile | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!row) return null;
    return {
      userId: row.id,
      name: row.name,
      skills: row.skills ? JSON.parse(row.skills) : [],
      resumeKey: row.resumeKey
    };
  }
}

export class SQLitePreferenceRepository {
  constructor(private db: DatabaseSync) {}
  async getPreference(userId: string): Promise<Preference | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!row) return null;
    return {
      userId: row.id,
      targetRate: row.targetRate || 100,
      minRate: row.minRate || 50,
      blockedClients: row.blockedClients ? JSON.parse(row.blockedClients) : [],
      updatedAt: new Date(row.updatedAt || Date.now())
    };
  }
}

export class SQLiteEvidenceRepository {
  constructor(private db: DatabaseSync) {}
  async getEvidenceForSkills(userId: string, skills: string[]): Promise<any[]> {
    if (skills.length === 0) return [];
    const rows = this.db.prepare('SELECT * FROM evidence WHERE userId = ?').all(userId) as any[];
    return rows.filter(r => {
       const meta = r.metadata ? JSON.parse(r.metadata) : {};
       const evSkills = meta.skills || [];
       return evSkills.some((s: string) => skills.includes(s));
    });
  }
}

export class SQLiteEvaluationRepository {
  constructor(private db: DatabaseSync) {}
  async saveEvaluation(record: any): Promise<void> {
    this.db.prepare(\`
      INSERT INTO evaluations (
        id, opportunityId, overall, technicalFit, evidenceStrength, budgetFit, 
        preferenceFit, scopeClarity, route, qualificationFlags, priority, 
        deepReasonStatus, explanations
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        overall=excluded.overall,
        route=excluded.route
    \`).run(
      record.id, 
      record.opportunityId, 
      record.scoreBreakdown.overall,
      record.scoreBreakdown.dimensions.technicalFit,
      record.scoreBreakdown.dimensions.evidenceStrength,
      record.scoreBreakdown.dimensions.budgetFit,
      record.scoreBreakdown.dimensions.preferenceFit,
      record.scoreBreakdown.dimensions.scopeClarity,
      record.evaluationRoute, 
      JSON.stringify(record.qualificationFlags),
      record.priority,
      record.deepReasonStatus,
      JSON.stringify(record.scoreBreakdown.explanations || {})
    );
  }
}
`;
fs.writeFileSync(repoPath, repoCode.trim() + '\n');
console.log('Repositories and schema updated.');
