const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

pkg.scripts = {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck",
    "db:init": "node -e \\"const db = require('node:sqlite').DatabaseSync('./data/autogig.db'); require('./packages/db/dist/schema.js').initializeSchema(db)\\"",
    "db:reset": "node -e \\"const fs=require('fs'); fs.existsSync('./data/autogig.db') && fs.unlinkSync('./data/autogig.db')\\" && npm run db:init",
    "ingest:demo": "npm --workspace=ingestion-worker run start",
    "worker": "npm --workspace=opportunity-worker run start",
    "worker:once": "npm --workspace=opportunity-worker run start -- --once",
    "test:e2e": "node ./e2e-test.js"
};
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log('Updated package.json scripts');

const e2eScript = `
const { execSync } = require('child_process');
const fs = require('fs');

console.log('--- RUNNING E2E TEST ---');

// 1. Build everything
console.log('Building workspace...');
execSync('npm run build', { stdio: 'inherit' });

// 2. Reset DB
console.log('Resetting database...');
execSync('npm run db:reset', { stdio: 'inherit' });

// 3. Run Ingestion
console.log('Running ingestion worker...');
execSync('npm run ingest:demo', { stdio: 'inherit' });

// 4. Run Opportunity Worker (once mode)
console.log('Running opportunity worker...');
execSync('npm run worker:once', { stdio: 'inherit' });

// 5. Verify results
console.log('Verifying results...');
const db = require('node:sqlite').DatabaseSync('./data/autogig.db');

const opp1 = db.prepare('SELECT status FROM opportunities WHERE id = ?').get('opp-demo-1');
const opp2 = db.prepare('SELECT status FROM opportunities WHERE id = ?').get('opp-demo-2');

if (opp1.status !== 'NORMALIZED') throw new Error('opp-demo-1 status is ' + opp1.status);
if (opp2.status !== 'NORMALIZED') throw new Error('opp-demo-2 status is ' + opp2.status);

const completedEvents = db.prepare("SELECT count(*) as c FROM event_queue WHERE status = 'COMPLETED'").get();
if (completedEvents.c !== 2) throw new Error('Expected 2 completed events');

console.log('E2E TEST PASSED!');
`;
fs.writeFileSync(path.join(__dirname, 'e2e-test.js'), e2eScript.trim() + '\n');
console.log('Created e2e-test.js');


