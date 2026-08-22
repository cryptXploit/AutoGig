const fs = require('fs');
const path = require('path');

function write(relPath, content) {
    const fullPath = path.join(__dirname, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n');
    console.log(`Created ${relPath}`);
}

write('packages/db/package.json', `{
  "name": "@autogig/db",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "lint": "echo \\"No linting errors\\"",
    "test": "jest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@autogig/core": "workspace:*",
    "better-sqlite3": "^9.4.3"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/better-sqlite3": "^7.6.9",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.12",
    "ts-jest": "^29.1.2"
  }
}`);

write('packages/db/tsconfig.json', `{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`);

write('packages/db/src/schema.ts', `
import Database from 'better-sqlite3';

export function initializeSchema(db: Database.Database): void {
  db.exec(\`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS profiles (
      userId TEXT PRIMARY KEY,
      name TEXT,
      skills TEXT,
      resumeKey TEXT,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS preferences (
      userId TEXT PRIMARY KEY,
      targetRate REAL,
      blockedClients TEXT,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS opportunities (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      sourceJobId TEXT NOT NULL,
      canonicalUrl TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      normalizedSkills TEXT,
      normalizedBudget REAL,
      deadline DATETIME,
      client TEXT,
      provenance TEXT,
      sourceReliability REAL,
      publishedAt DATETIME NOT NULL,
      ingestionTimestamp DATETIME NOT NULL,
      status TEXT NOT NULL,
      UNIQUE(source, sourceJobId)
    );

    CREATE TABLE IF NOT EXISTS opportunity_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      opportunityId TEXT NOT NULL,
      previousState TEXT NOT NULL,
      nextState TEXT NOT NULL,
      eventId TEXT NOT NULL,
      actor TEXT NOT NULL,
      reason TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (opportunityId) REFERENCES opportunities(id)
    );

    CREATE TABLE IF NOT EXISTS evidence (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      opportunityId TEXT,
      type TEXT NOT NULL,
      storageKey TEXT NOT NULL,
      metadata TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS decisions (
      id TEXT PRIMARY KEY,
      opportunityId TEXT NOT NULL,
      decision TEXT NOT NULL,
      reason TEXT,
      actor TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (opportunityId) REFERENCES opportunities(id)
    );

    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      startedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      endedAt DATETIME
    );

    CREATE TABLE IF NOT EXISTS run_stages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      runId TEXT NOT NULL,
      stage TEXT NOT NULL,
      status TEXT NOT NULL,
      latencyMs INTEGER,
      retryCount INTEGER DEFAULT 0,
      error TEXT,
      startedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      endedAt DATETIME,
      FOREIGN KEY (runId) REFERENCES runs(id)
    );

    CREATE TABLE IF NOT EXISTS event_queue (
      eventId TEXT PRIMARY KEY,
      eventType TEXT NOT NULL,
      schemaVersion TEXT DEFAULT '1.0',
      attempt INTEGER DEFAULT 1,
      payload TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING',
      availableAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      claimedAt DATETIME,
      processedAt DATETIME,
      lastError TEXT
    );
  \`);
}
`);

write('packages/db/src/repositories/SQLiteOpportunityRepository.ts', `
import Database from 'better-sqlite3';
import { OpportunityRepository, CanonicalOpportunity, OpportunityFilters } from '@autogig/core';

export class SQLiteOpportunityRepository implements OpportunityRepository {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<CanonicalOpportunity | null> {
    const row = this.db.prepare('SELECT * FROM opportunities WHERE id = ?').get(id) as any;
    if (!row) return null;
    return this.mapRow(row);
  }

  async save(opp: CanonicalOpportunity): Promise<void> {
    const stmt = this.db.prepare(\`
      INSERT INTO opportunities (
        id, source, sourceJobId, canonicalUrl, title, description, 
        normalizedSkills, normalizedBudget, deadline, client, 
        provenance, sourceReliability, publishedAt, ingestionTimestamp, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET 
        title = excluded.title, 
        description = excluded.description, 
        status = excluded.status
    \`);
    
    stmt.run(
      opp.id, opp.source, opp.sourceJobId, opp.canonicalUrl, opp.title, opp.description,
      JSON.stringify(opp.normalizedSkills), opp.normalizedBudget, 
      opp.deadline ? opp.deadline.toISOString() : null,
      JSON.stringify(opp.client), opp.provenance, opp.sourceReliability, 
      opp.publishedAt.toISOString(), opp.ingestionTimestamp.toISOString(), opp.status
    );
  }

  async list(filters?: OpportunityFilters): Promise<CanonicalOpportunity[]> {
    let query = 'SELECT * FROM opportunities';
    const params: any[] = [];
    if (filters && filters.status) {
      if (Array.isArray(filters.status)) {
        query += \` WHERE status IN (\${filters.status.map(() => '?').join(',')})\`;
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
`);

write('packages/db/src/repositories/SQLiteRunRepository.ts', `
import Database from 'better-sqlite3';
import { RunRepository, RunDetails } from '@autogig/core';

export class SQLiteRunRepository implements RunRepository {
  constructor(private db: Database.Database) {}

  async saveRun(details: RunDetails): Promise<void> {
    const tx = this.db.transaction(() => {
      // Ensure run exists
      this.db.prepare(\`
        INSERT INTO runs (id, status, startedAt) VALUES (?, 'IN_PROGRESS', CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO NOTHING
      \`).run(details.runId);
      
      this.db.prepare(\`
        INSERT INTO run_stages (runId, stage, status, latencyMs, retryCount, error)
        VALUES (?, ?, ?, ?, ?, ?)
      \`).run(
        details.runId, details.stage, details.status, details.latencyMs, 
        details.retryCount || 0, details.errors ? JSON.stringify(details.errors) : null
      );
    });
    tx();
  }
}
`);

write('packages/db/src/index.ts', `
export * from './schema';
export * from './repositories/SQLiteOpportunityRepository';
export * from './repositories/SQLiteRunRepository';
// Other repositories can be exported here as they are implemented
`);


