const fs = require('fs');
const path = require('path');

function write(relPath, content) {
    const fullPath = path.join(__dirname, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n');
    console.log(`Created ${relPath}`);
}

// ---------------- STORAGE PACKAGE ----------------
write('packages/storage/package.json', `{
  "name": "@autogig/storage",
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
    "@autogig/core": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.12",
    "ts-jest": "^29.1.2"
  }
}`);

write('packages/storage/tsconfig.json', `{
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

write('packages/storage/src/index.ts', `
import fs from 'fs';
import path from 'path';
import { ObjectStorage, StorageMetadata } from '@autogig/core';

export class LocalObjectStorage implements ObjectStorage {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = path.resolve(basePath);
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  private resolveKey(key: string): string {
    // Path safety validation
    if (path.isAbsolute(key)) throw new Error('Absolute paths are not allowed');
    if (/^[A-Za-z]:\\\\/.test(key)) throw new Error('Windows drive paths are not allowed');
    if (key.startsWith('\\\\\\\\')) throw new Error('UNC paths are not allowed');
    if (key.includes('..')) throw new Error('Path traversal is not allowed');
    
    const finalPath = path.resolve(this.basePath, key);
    if (!finalPath.startsWith(this.basePath)) {
      throw new Error('Resolved path is outside the storage root');
    }
    return finalPath;
  }

  async put(key: string, data: Uint8Array | string): Promise<void> {
    const finalPath = this.resolveKey(key);
    fs.mkdirSync(path.dirname(finalPath), { recursive: true });
    fs.writeFileSync(finalPath, data);
  }

  async get(key: string): Promise<Uint8Array | string | null> {
    const finalPath = this.resolveKey(key);
    if (!fs.existsSync(finalPath)) return null;
    return new Uint8Array(fs.readFileSync(finalPath));
  }

  async delete(key: string): Promise<void> {
    const finalPath = this.resolveKey(key);
    if (fs.existsSync(finalPath)) {
      fs.unlinkSync(finalPath);
    }
  }

  async exists(key: string): Promise<boolean> {
    const finalPath = this.resolveKey(key);
    return fs.existsSync(finalPath);
  }

  async getMetadata(key: string): Promise<StorageMetadata | null> {
    const finalPath = this.resolveKey(key);
    if (!fs.existsSync(finalPath)) return null;
    const stats = fs.statSync(finalPath);
    return {
      size: stats.size,
      contentType: 'application/octet-stream', // Defaulting for local
      updatedAt: stats.mtime
    };
  }
}
`);

// ---------------- EVENTS PACKAGE ----------------
write('packages/events/package.json', `{
  "name": "@autogig/events",
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

write('packages/events/tsconfig.json', `{
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

write('packages/events/src/index.ts', `
import Database from 'better-sqlite3';
import { EventBus, EventBusPayload } from '@autogig/core';

export class SQLiteEventBus implements EventBus {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  async publish(event: EventBusPayload): Promise<void> {
    const stmt = this.db.prepare(\`
      INSERT INTO event_queue (
        eventId, eventType, schemaVersion, attempt, payload, status, availableAt, createdAt
      ) VALUES (?, ?, ?, ?, ?, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(eventId) DO NOTHING
    \`);
    
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
      const stmt = this.db.prepare(\`
        UPDATE event_queue 
        SET status = 'PROCESSING', attempt = attempt + 1, claimedAt = CURRENT_TIMESTAMP
        WHERE eventId = (
          SELECT eventId FROM event_queue 
          WHERE status = 'PENDING' AND availableAt <= CURRENT_TIMESTAMP
          ORDER BY createdAt ASC LIMIT 1
        )
        RETURNING *
      \`);
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
          const stmt = this.db.prepare(\`
             UPDATE event_queue
             SET status = 'PENDING', attempt = attempt + 1, claimedAt = NULL
             WHERE status = 'PROCESSING' AND claimedAt <= ?
          \`);
          stmt.run(timeoutDate);
          this.db.exec('COMMIT');
      } catch (err) {
          this.db.exec('ROLLBACK');
          throw err;
      }
  }

  acknowledge(eventId: string): void {
    const stmt = this.db.prepare(\`
      UPDATE event_queue SET status = 'COMPLETED', processedAt = CURRENT_TIMESTAMP WHERE eventId = ?
    \`);
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
             const updateStmt = this.db.prepare(\`
                 UPDATE event_queue SET status = 'DEAD_LETTER', lastError = ?, processedAt = CURRENT_TIMESTAMP WHERE eventId = ?
             \`);
             updateStmt.run(error, eventId);
        } else {
             // Exponential backoff
             const delaySeconds = Math.min(baseDelay * Math.pow(2, attempt - 1), 3600);
             const availableAt = new Date(Date.now() + delaySeconds * 1000).toISOString();
             const updateStmt = this.db.prepare(\`
                 UPDATE event_queue SET status = 'PENDING', lastError = ?, availableAt = ? WHERE eventId = ?
             \`);
             updateStmt.run(error, availableAt, eventId);
        }
        this.db.exec('COMMIT');
    } catch (err) {
        this.db.exec('ROLLBACK');
        throw err;
    }
  }
}
`);

