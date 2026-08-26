const { execSync, spawn } = require('child_process');
const { DatabaseSync } = require('node:sqlite');
const http = require('http');

async function run() {
  console.log('1. db:reset');
  execSync('npm run db:reset', { stdio: 'inherit' });

  console.log('2. ingest:demo:once');
  execSync('npm run ingest:demo:once', { stdio: 'inherit' });

  console.log('3. worker:once');
  execSync('npm run worker:once', { stdio: 'inherit' });

  console.log('4/5. DB Check');
  const db = new DatabaseSync('./data/autogig.db');
  db.exec('PRAGMA foreign_keys = ON;');
  const opps = db.prepare('SELECT id, title FROM opportunities').all();
  const ci = db.prepare('SELECT * FROM client_intelligence').all();
  console.log(`Found ${opps.length} opportunities, ${ci.length} client_intelligence rows.`);

  let orphanCount = 0;
  let testOppId = null;
  for (const row of ci) {
    if (!testOppId && row.trustScore > 80) testOppId = row.opportunityId;
    const opp = db.prepare('SELECT id FROM opportunities WHERE id = ?').get(row.opportunityId);
    if (!opp) orphanCount++;
  }
  if (orphanCount > 0) throw new Error(`Found ${orphanCount} orphans!`);
  
  if (!testOppId) testOppId = ci[0].opportunityId; // fallback

  console.log('6. Start real web-api process');
  const api = spawn('npm', ['--workspace=web-api', 'run', 'start'], { shell: true });
  
  // Wait for API to be ready
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log(`7. Fetching GET /api/opportunities/${testOppId}`);
  try {
    const res = await fetch(`http://localhost:8080/api/opportunities/${testOppId}`);
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const json = await res.json();
    
    console.log('8. Verifying payload...');
    if (!json.success) throw new Error("success !== true");
    if (!json.data.opportunity) throw new Error("opportunity missing");
    if (!json.data.clientIntelligence) throw new Error("clientIntelligence missing");
    
    const intel = json.data.clientIntelligence;
    if (intel.opportunityId !== json.data.opportunity.id) throw new Error(`Mismatch: ${intel.opportunityId} vs ${json.data.opportunity.id}`);
    
    if (!intel.recommendation) throw new Error("Missing recommendation");
    if (!['LOW', 'MEDIUM', 'HIGH', 'UNKNOWN'].includes(intel.overallRiskLevel)) throw new Error(`Invalid risk: ${intel.overallRiskLevel}`);
    if (!Array.isArray(intel.signals)) throw new Error("Missing signals array");
    
    console.log(`Verified! Risk: ${intel.overallRiskLevel}, Recommendation: ${intel.recommendation}, TrustScore: ${intel.trustScore}`);
    console.log('✅ G4.3 E2E HTTP Pipeline PASSED');
    
  } finally {
    // 9. Terminate process cleanly
    console.log('Killing API process...');
    try {
      execSync(`taskkill /pid ${api.pid} /t /f`, { stdio: 'ignore' });
    } catch(e) {}
  }
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
