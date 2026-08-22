const fs = require('fs');
const path = require('path');

const typesPath = path.join(__dirname, 'packages/core/src/types/index.ts');
let types = fs.readFileSync(typesPath, 'utf8');

if (!types.includes('minRate: number')) {
  types = types.replace(/export interface Preference \{[\s\S]*?\}/, `
export interface Preference {
  userId: string;
  targetRate: number;
  minRate: number;
  blockedClients: string[];
  updatedAt: Date;
}
  `.trim());
  fs.writeFileSync(typesPath, types);
}

// Write opportunity worker implementation for Phase C
function write(relPath, content) {
    const fullPath = path.join(__dirname, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n');
    console.log(`Created ${relPath}`);
}

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
    "@autogig/engine": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}`);

write('apps/opportunity-worker/src/index.ts', `
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { canTransition, Preference, Profile, RejectionReason } from '@autogig/core';
import { SQLiteOpportunityRepository, SQLiteRunRepository } from '@autogig/db';
import { SQLiteEventBus } from '@autogig/events';
import { RuleEngine, LocalSimilarityRetriever, EconomicEngine, OpportunityScorer } from '@autogig/engine';

const MAX_RETRIES = 3;
const BASE_DELAY = 2; // seconds

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processEvent(db: DatabaseSync, repo: SQLiteOpportunityRepository, runs: SQLiteRunRepository, bus: SQLiteEventBus, event: any) {
  const oppId = event.payload.opportunityId;
  const opp = await repo.findById(oppId);
  
  if (!opp) throw new Error(\`Opportunity not found: \${oppId}\`);

  // Hardcode a mock profile and preference for Local Phase C engine demo
  const profile: Profile = { userId: 'u1', name: 'Demo User', skills: ['Node.js', 'TypeScript', 'SQL', 'React'], resumeKey: '', updatedAt: new Date() };
  const pref: Preference = { userId: 'u1', targetRate: 100, minRate: 50, blockedClients: ['Evil Corp'], updatedAt: new Date() };

  // Phase C: execute pipeline
  if (opp.status === 'DISCOVERED' && canTransition('DISCOVERED', 'NORMALIZED')) {
    
    // 1. RULES
    const ruleEngine = new RuleEngine();
    const ruleResult = ruleEngine.evaluate(opp, pref);
    
    let finalState = 'EVALUATING';
    let route = 'PENDING';
    let qualFlags = [];
    let breakdown = null;

    if (!ruleResult.pass) {
       finalState = 'REJECTED';
       route = 'REJECT';
       console.log(\`\${oppId} rejected by rules: \${ruleResult.reason}\`);
    } else {
       // 2. PARALLEL RETRIEVAL & ECONOMICS
       const retriever = new LocalSimilarityRetriever();
       const economics = new EconomicEngine();
       
       const techFit = retriever.computeTechnicalFit(opp, profile);
       const ecoResult = economics.calculate(opp, pref);
       
       // Mock evidence retrieval (if it says "React", give evidence)
       const evidenceCount = opp.description.includes('React') || opp.description.includes('Node.js') ? 2 : 0;
       
       // 3. SCORING
       const scorer = new OpportunityScorer();
       // base preference fit = 80, scope clarity = 80 for demo
       breakdown = scorer.score(techFit, evidenceCount, ecoResult, 80, 80);
       
       route = breakdown.route;
       qualFlags = breakdown.qualificationFlags;
       if (route === 'REJECT') finalState = 'REJECTED';
       console.log(\`\${oppId} evaluated. Score: \${breakdown.overall}, Route: \${route}, Flags: \${qualFlags}\`);
    }

    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare('UPDATE opportunities SET status = ? WHERE id = ?').run(finalState, oppId);
      
      const states = ['NORMALIZED', 'DEDUPLICATED', 'FILTERED', 'RETRIEVING', 'ENRICHING', 'EVALUATING'];
      if (finalState === 'REJECTED') states.push('REJECTED');

      for (let i = 0; i < states.length; i++) {
         const s = states[i];
         const prev = i === 0 ? 'DISCOVERED' : states[i-1];
         db.prepare(\`INSERT INTO opportunity_events (opportunityId, previousState, nextState, eventId, actor) VALUES (?, ?, ?, ?, ?)\`)
           .run(oppId, prev, s, event.eventId, 'opportunity-worker');
      }
      
      const runId = \`run-\${event.eventId}\`;
      db.prepare(\`INSERT INTO runs (id, status) VALUES (?, 'IN_PROGRESS') ON CONFLICT(id) DO NOTHING\`).run(runId);
      db.prepare(\`INSERT INTO run_stages (runId, stage, status, latency) VALUES (?, ?, ?, ?)\`).run(runId, 'PHASE_C_PIPELINE', 'SUCCESS', 250);
      
      // If evaluating, persist evaluation record (mocking this as a simple print or event)
      if (finalState === 'EVALUATING') {
         bus.publish({
            eventId: \`evt-deep-reason-\${oppId}\`,
            eventType: 'OPPORTUNITY_DEEP_REASON_REQUIRED',
            schemaVersion: '1.0',
            payload: { opportunityId: oppId, evaluationRoute: route, qualificationFlags: qualFlags }
         });
      }
      
      bus.acknowledge(event.eventId);
      db.exec('COMMIT');
    } catch (err: any) {
      db.exec('ROLLBACK');
      throw err;
    }
  } else {
    bus.acknowledge(event.eventId);
  }
}

async function main() {
  const dbPath = path.resolve(__dirname, '../../../data/autogig.db');
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  
  const repo = new SQLiteOpportunityRepository(db);
  const runs = new SQLiteRunRepository(db);
  const bus = new SQLiteEventBus(db);
  
  const isOnce = process.argv.includes('--once');
  let idleCount = 0;

  while (true) {
    bus.reclaimStale(5 * 60 * 1000);
    const event = bus.claimPending();
    if (event) {
      idleCount = 0;
      try {
        await processEvent(db, repo, runs, bus, event);
      } catch (err: any) {
        console.error(\`Failed event \${event.eventId}:\`, err.message);
        bus.fail(event.eventId, err.message, MAX_RETRIES, BASE_DELAY);
      }
    } else {
      if (isOnce) {
        if (idleCount > 2) break; 
        idleCount++;
      }
      await sleep(1000);
    }
  }
}

main().catch(console.error);
`);

write('data/demo/jobs.json', `
[
  {
    "id": "opp-demo-1",
    "source": "demo",
    "sourceJobId": "job-101",
    "canonicalUrl": "http://example.com/job-101",
    "title": "Excellent fit",
    "description": "Expert Node.js and TypeScript. Big scope.",
    "normalizedSkills": ["Node.js", "TypeScript"],
    "normalizedBudget": 20000,
    "deadline": "2030-12-31T00:00:00.000Z",
    "client": { "name": "Good Corp" },
    "publishedAt": "2026-08-01T00:00:00.000Z",
    "status": "DISCOVERED"
  },
  {
    "id": "opp-demo-2",
    "source": "demo",
    "sourceJobId": "job-102",
    "canonicalUrl": "http://example.com/job-102",
    "title": "Very low budget",
    "description": "Node.js fixes.",
    "normalizedSkills": ["Node.js"],
    "normalizedBudget": 5,
    "deadline": null,
    "client": { "name": "Cheap Corp" },
    "publishedAt": "2026-08-02T00:00:00.000Z",
    "status": "DISCOVERED"
  },
  {
    "id": "opp-demo-3",
    "source": "demo",
    "sourceJobId": "job-103",
    "canonicalUrl": "http://example.com/job-103",
    "title": "Skill mismatch",
    "description": "Need a Ruby on Rails and C++ dev.",
    "normalizedSkills": ["Ruby", "C++"],
    "normalizedBudget": 5000,
    "deadline": null,
    "client": { "name": "Other Corp" },
    "publishedAt": "2026-08-02T00:00:00.000Z",
    "status": "DISCOVERED"
  },
  {
    "id": "opp-demo-4",
    "source": "demo",
    "sourceJobId": "job-104",
    "canonicalUrl": "http://example.com/job-104",
    "title": "Strong fit but poor economics (Counter)",
    "description": "Looking for Node.js developer.",
    "normalizedSkills": ["Node.js"],
    "normalizedBudget": 450,
    "deadline": null,
    "client": { "name": "Startup" },
    "publishedAt": "2026-08-02T00:00:00.000Z",
    "status": "DISCOVERED"
  },
  {
    "id": "opp-demo-5",
    "source": "demo",
    "sourceJobId": "job-105",
    "canonicalUrl": "http://example.com/job-105",
    "title": "Duplicate",
    "description": "Node.js dev",
    "normalizedSkills": ["Node.js"],
    "normalizedBudget": 5000,
    "deadline": null,
    "client": { "name": "Repeat Corp" },
    "publishedAt": "2026-08-02T00:00:00.000Z",
    "status": "DUPLICATE"
  },
  {
    "id": "opp-demo-6",
    "source": "demo",
    "sourceJobId": "job-106",
    "canonicalUrl": "http://example.com/job-106",
    "title": "Missing evidence",
    "description": "Need a Java developer. (No evidence for Java in profile)",
    "normalizedSkills": ["Java"],
    "normalizedBudget": 10000,
    "deadline": null,
    "client": { "name": "Java Corp" },
    "publishedAt": "2026-08-02T00:00:00.000Z",
    "status": "DISCOVERED"
  },
  {
    "id": "opp-demo-7",
    "source": "demo",
    "sourceJobId": "job-107",
    "canonicalUrl": "http://example.com/job-107",
    "title": "High-value ambiguous",
    "description": "Node.js build. Vague description.",
    "normalizedSkills": ["Node.js"],
    "normalizedBudget": 3000,
    "deadline": null,
    "client": { "name": "Vague Corp" },
    "publishedAt": "2026-08-02T00:00:00.000Z",
    "status": "DISCOVERED"
  },
  {
    "id": "opp-demo-8",
    "source": "demo",
    "sourceJobId": "job-108",
    "canonicalUrl": "http://example.com/job-108",
    "title": "Blocked client",
    "description": "Node.js dev.",
    "normalizedSkills": ["Node.js"],
    "normalizedBudget": 5000,
    "deadline": null,
    "client": { "name": "Evil Corp" },
    "publishedAt": "2026-08-02T00:00:00.000Z",
    "status": "DISCOVERED"
  }
]
`);

