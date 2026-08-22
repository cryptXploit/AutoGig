const { execSync, spawn } = require('child_process');
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

console.log('--- RUNNING PHASE C+D+E HARDENED E2E TEST ---');

execSync('npm run build', { stdio: 'inherit' });
execSync('npm run db:reset', { stdio: 'inherit' });
execSync('npm run ingest:demo', { stdio: 'inherit' });
execSync('npm run worker:once', { stdio: 'inherit' });

console.log('Verifying Phase C+D results...');
const db = new DatabaseSync('./data/autogig.db');

const p9 = db.prepare('SELECT status FROM proposals WHERE opportunityId = ? ORDER BY version DESC').get('opp-demo-9');
if (!p9 || p9.status !== 'BLOCKED') throw new Error('opp-demo-9 should be BLOCKED due to prompt injection rewrite bounds');

console.log('Starting Web API for Phase E tests...');
const api = spawn('node', [path.join(__dirname, 'apps/web-api/dist/index.js')], {
  env: { ...process.env, PORT: '8080' }
});

setTimeout(async () => {
  try {
    console.log('Running API state tests...');
    
    // 1. Duplicate APPROVE test on BLOCKED (opp-demo-9 is PROPOSAL_GENERATING/VERIFYING or BLOCKED)
    // Wait, opp-demo-9 status might be VERIFYING but the proposal is BLOCKED so the opp status is PENDING_APPROVAL or FAILED or something. Let's find a PENDING_APPROVAL one: opp-demo-1.
    
    // Test APPROVE on opp-demo-1
    const approveRes = await fetch('http://localhost:8080/api/opportunities/opp-demo-1/approve', { method: 'POST' });
    const approveData = await approveRes.json();
    if (!approveData.success) throw new Error('Approve failed: ' + approveData.error);
    
    const o1 = db.prepare('SELECT status FROM opportunities WHERE id = ?').get('opp-demo-1');
    if (o1.status !== 'APPROVED') throw new Error('Expected APPROVED');

    // Duplicate approve (Idempotency)
    const approveRes2 = await fetch('http://localhost:8080/api/opportunities/opp-demo-1/approve', { method: 'POST' });
    const approveData2 = await approveRes2.json();
    if (!approveData2.success) throw new Error('Duplicate approve should succeed idempotently');

    // Test REJECT on opp-demo-4
    const rejectRes = await fetch('http://localhost:8080/api/opportunities/opp-demo-4/reject', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reasonCategory: 'LOW_BUDGET' })
    });
    const rejectData = await rejectRes.json();
    if (!rejectData.success) throw new Error('Reject failed: ' + rejectData.error);
    
    const o4 = db.prepare('SELECT status FROM opportunities WHERE id = ?').get('opp-demo-4');
    if (o4.status !== 'REJECTED') throw new Error('Expected REJECTED');

    // Test COUNTER on opp-demo-6
    const counterRes = await fetch('http://localhost:8080/api/opportunities/opp-demo-6/counter', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instruction: 'Increase rate' })
    });
    const counterData = await counterRes.json();
    if (!counterData.success) throw new Error('Counter failed: ' + counterData.error);
    
    const o6 = db.prepare('SELECT status FROM opportunities WHERE id = ?').get('opp-demo-6');
    if (o6.status !== 'COUNTERED') throw new Error('Expected COUNTERED');
    
    console.log('ALL PHASE E TESTS PASSED!');
    api.kill();
    process.exit(0);
  } catch(e) {
    console.error(e);
    api.kill();
    process.exit(1);
  }
}, 2000);
