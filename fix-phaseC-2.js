const fs = require('fs');
const path = require('path');

const repoCode = `
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
      resumeKey: row.resumeKey,
      updatedAt: new Date(row.updatedAt)
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
      updatedAt: new Date(row.updatedAt)
    };
  }
}

export class SQLiteEvidenceRepository {
  constructor(private db: DatabaseSync) {}
  async getEvidenceForSkills(userId: string, skills: string[]): Promise<any[]> {
    if (skills.length === 0) return [];
    // Mocking real evidence fetch
    const stmt = this.db.prepare('SELECT * FROM evidence WHERE userId = ?');
    const allEvidence = stmt.all(userId) as any[];
    return allEvidence.filter(e => {
       const evSkills = e.skills ? JSON.parse(e.skills) : [];
       return evSkills.some((s: string) => skills.includes(s));
    });
  }
}

export class SQLiteEvaluationRepository {
  constructor(private db: DatabaseSync) {}
  async saveEvaluation(record: any): Promise<void> {
    this.db.prepare(\`
      INSERT INTO evaluations (id, opportunityId, score, routingDecision, reason)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        score=excluded.score,
        routingDecision=excluded.routingDecision,
        reason=excluded.reason
    \`).run(record.id, record.opportunityId, record.scoreBreakdown.overall, record.evaluationRoute, JSON.stringify(record.scoreBreakdown));
  }
}
`;
fs.writeFileSync('packages/db/src/repositories/SQLiteOtherRepositories.ts', repoCode.trim() + '\n');

let dbIndex = fs.readFileSync('packages/db/src/index.ts', 'utf8');
if (!dbIndex.includes('SQLiteOtherRepositories')) {
  fs.writeFileSync('packages/db/src/index.ts', dbIndex + '\nexport * from "./repositories/SQLiteOtherRepositories";\n');
}

// Modify event_queue insert to IGNORE
let eventsCode = fs.readFileSync('packages/events/src/index.ts', 'utf8');
eventsCode = eventsCode.replace('INSERT INTO event_queue', 'INSERT OR IGNORE INTO event_queue');
fs.writeFileSync('packages/events/src/index.ts', eventsCode);

// Fix opportunity_events schema to support causationId
let schemaPath = 'packages/db/src/schema.ts';
let schema = fs.readFileSync(schemaPath, 'utf8');
if (!schema.includes('causationId TEXT')) {
   schema = schema.replace('eventId TEXT NOT NULL,', 'eventId TEXT NOT NULL, causationId TEXT,');
   fs.writeFileSync(schemaPath, schema);
}

console.log('Repositories created');
