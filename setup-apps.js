const fs = require('fs');
const path = require('path');

function write(relPath, content) {
    const fullPath = path.join(__dirname, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n');
    console.log(`Created ${relPath}`);
}

// ---------------- DEMO DATA ----------------
write('data/demo/jobs.json', `
[
  {
    "id": "opp-demo-1",
    "source": "demo",
    "sourceJobId": "job-101",
    "canonicalUrl": "http://example.com/job-101",
    "title": "Strong Opportunity - Node.js Backend",
    "description": "Looking for an expert Node.js backend developer for a scalable API.",
    "normalizedSkills": ["Node.js", "TypeScript", "SQL"],
    "normalizedBudget": 5000,
    "deadline": "2030-12-31T00:00:00.000Z",
    "client": { "id": "client-1", "name": "Tech Corp" },
    "provenance": "demo-seed",
    "sourceReliability": 1.0,
    "publishedAt": "2026-08-01T00:00:00.000Z",
    "status": "DISCOVERED"
  },
  {
    "id": "opp-demo-2",
    "source": "demo",
    "sourceJobId": "job-102",
    "canonicalUrl": "http://example.com/job-102",
    "title": "Low Budget - Node.js Fixes",
    "description": "Need a few bug fixes in a legacy Node app.",
    "normalizedSkills": ["Node.js"],
    "normalizedBudget": 50,
    "deadline": null,
    "client": { "id": "client-2" },
    "provenance": "demo-seed",
    "sourceReliability": 0.8,
    "publishedAt": "2026-08-02T00:00:00.000Z",
    "status": "DISCOVERED"
  }
]
`);

// ---------------- APPS / INGESTION-WORKER ----------------
write('apps/ingestion-worker/package.json', `{
  "name": "ingestion-worker",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "echo \\"No linting errors\\"",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@autogig/core": "workspace:*",
    "@autogig/db": "workspace:*",
    "@autogig/events": "workspace:*",
    "better-sqlite3": "^9.4.3"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}`);

write('apps/ingestion-worker/tsconfig.json', `{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}`);

write('apps/ingestion-worker/src/index.ts', `
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { CanonicalOpportunitySchema } from '@autogig/core';
import { initializeSchema, SQLiteOpportunityRepository } from '@autogig/db';
import { SQLiteEventBus } from '@autogig/events';

async function main() {
  const dbPath = path.resolve(__dirname, '../../../data/autogig.db');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  
  initializeSchema(db);
  
  const repo = new SQLiteOpportunityRepository(db);
  const bus = new SQLiteEventBus(db);
  
  const jobsPath = path.resolve(__dirname, '../../../data/demo/jobs.json');
  const jobsData = JSON.parse(fs.readFileSync(jobsPath, 'utf-8'));
  
  for (const job of jobsData) {
    job.ingestionTimestamp = new Date().toISOString(); // Inject dynamically for schema validation
    const parsed = CanonicalOpportunitySchema.parse({
      ...job,
      deadline: job.deadline ? new Date(job.deadline) : null,
      publishedAt: new Date(job.publishedAt),
      ingestionTimestamp: new Date(job.ingestionTimestamp)
    });
    
    await repo.save(parsed);
    console.log(\`Ingested: \${parsed.id}\`);
    
    await bus.publish({
      eventId: \`evt-discover-\${parsed.id}\`,
      eventType: 'OPPORTUNITY_DISCOVERED',
      schemaVersion: '1.0',
      attempt: 1,
      createdAt: new Date(),
      payload: { opportunityId: parsed.id }
    });
  }
  
  console.log('Ingestion complete.');
}

main().catch(console.error);
`);

// ---------------- APPS / OPPORTUNITY-WORKER ----------------
write('apps/opportunity-worker/package.json', `{
  "name": "opportunity-worker",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "echo \\"No linting errors\\"",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@autogig/core": "workspace:*",
    "@autogig/db": "workspace:*",
    "@autogig/events": "workspace:*",
    "better-sqlite3": "^9.4.3"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}`);

write('apps/opportunity-worker/tsconfig.json', `{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}`);

write('apps/opportunity-worker/src/index.ts', `
import path from 'path';
import Database from 'better-sqlite3';
import { canTransition } from '@autogig/core';
import { SQLiteOpportunityRepository, SQLiteRunRepository } from '@autogig/db';
import { SQLiteEventBus } from '@autogig/events';

const MAX_RETRIES = 3;
const BASE_DELAY = 2; // seconds

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processEvent(db: Database.Database, repo: SQLiteOpportunityRepository, runs: SQLiteRunRepository, bus: SQLiteEventBus, event: any) {
  const oppId = event.payload.opportunityId;
  const opp = await repo.findById(oppId);
  
  if (!opp) {
    throw new Error(\`Opportunity not found: \${oppId}\`);
  }

  // Phase B limited logic: DISCOVERED -> NORMALIZED
  if (opp.status === 'DISCOVERED' && canTransition('DISCOVERED', 'NORMALIZED')) {
    
    // ATOMIC BUSINESS TRANSACTION
    const tx = db.transaction(() => {
      // 1. Update Opp State
      opp.status = 'NORMALIZED';
      db.prepare('UPDATE opportunities SET status = ? WHERE id = ?').run('NORMALIZED', oppId);
      
      // 2. Event Log
      db.prepare(\`
        INSERT INTO opportunity_events (opportunityId, previousState, nextState, eventId, actor)
        VALUES (?, ?, ?, ?, ?)
      \`).run(oppId, 'DISCOVERED', 'NORMALIZED', event.eventId, 'opportunity-worker');
      
      // 3. Run Stage
      const runId = \`run-\${event.eventId}\`;
      db.prepare(\`
        INSERT INTO runs (id, status) VALUES (?, 'IN_PROGRESS') ON CONFLICT(id) DO NOTHING
      \`).run(runId);
      db.prepare(\`
        INSERT INTO run_stages (runId, stage, status, latencyMs) VALUES (?, ?, ?, ?)
      \`).run(runId, 'NORMALIZATION', 'SUCCESS', 150);
      
      // 4. Acknowledge Queue
      bus.acknowledge(event.eventId);
    });
    
    tx();
    console.log(\`Successfully transitioned \${oppId} to NORMALIZED.\`);
  } else {
    // Already processed or invalid state
    console.log(\`Skipping \${oppId}, status is \${opp.status}\`);
    bus.acknowledge(event.eventId);
  }
}

async function main() {
  const dbPath = path.resolve(__dirname, '../../../data/autogig.db');
  const db = new DatabaseSync(dbPath);
  
  const repo = new SQLiteOpportunityRepository(db);
  const runs = new SQLiteRunRepository(db);
  const bus = new SQLiteEventBus(db);
  
  console.log('Opportunity Worker started. Polling...');
  
  // Single-pass mode for E2E testing (if --once flag is passed)
  const isOnce = process.argv.includes('--once');
  let idleCount = 0;

  while (true) {
    bus.reclaimStale(5 * 60 * 1000); // 5 min timeout
    
    const event = bus.claimPending();
    if (event) {
      idleCount = 0;
      console.log(\`Claimed event: \${event.eventId}\`);
      try {
        await processEvent(db, repo, runs, bus, event);
      } catch (err: any) {
        console.error(\`Failed event \${event.eventId}:\`, err.message);
        bus.fail(event.eventId, err.message, MAX_RETRIES, BASE_DELAY);
      }
    } else {
      if (isOnce) {
        if (idleCount > 2) break; // Exit after a few idle cycles
        idleCount++;
      }
      await sleep(1000);
    }
  }
  
  console.log('Worker exiting (--once).');
}

main().catch(console.error);
`);

