const fs = require('fs');

const jPath = 'data/demo/jobs.json';
const jobs = JSON.parse(fs.readFileSync(jPath, 'utf8'));
const job5 = jobs.find(j => j.id === 'opp-demo-5');
if (job5) {
  job5.sourceJobId = 'job-101'; // duplicate of opp-demo-1
}
fs.writeFileSync(jPath, JSON.stringify(jobs, null, 2));

const e2e = `
const { execSync } = require('child_process');
const { DatabaseSync } = require('node:sqlite');

console.log('--- RUNNING PHASE C HARDENED E2E TEST ---');

execSync('npm run build', { stdio: 'inherit' });
execSync('npm run db:reset', { stdio: 'inherit' });
execSync('npm run ingest:demo', { stdio: 'inherit' });
execSync('npm run worker:once', { stdio: 'inherit' });

console.log('Verifying results...');
const db = new DatabaseSync('./data/autogig.db');

const checks = [
  { id: 'opp-demo-1', expStatus: 'EVALUATING' }, 
  { id: 'opp-demo-2', expStatus: 'REJECTED' },   
  { id: 'opp-demo-3', expStatus: 'REJECTED' },   
  { id: 'opp-demo-4', expStatus: 'EVALUATING' }, 
  { id: 'opp-demo-5', expStatus: 'REJECTED' },   // Duplicate via sourceJobId
  { id: 'opp-demo-6', expStatus: 'EVALUATING' }, 
  { id: 'opp-demo-7', expStatus: 'EVALUATING' }, 
  { id: 'opp-demo-8', expStatus: 'REJECTED' }    // Blocked client
];

for (const c of checks) {
  const row = db.prepare('SELECT status FROM opportunities WHERE id = ?').get(c.id);
  if (!row) throw new Error(\`Missing \${c.id}\`);
  if (row.status !== c.expStatus) {
    throw new Error(\`Expected \${c.id} to be \${c.expStatus}, got \${row.status}\`);
  }
}
console.log('E2E TEST PASSED!');
`;
fs.writeFileSync('e2e-test.js', e2e.trim() + '\n');
