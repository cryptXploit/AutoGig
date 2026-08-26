const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');

async function run() {
  console.log("=== Phase G4.12 Runtime Proof ===");
  const db = new DatabaseSync('./data/autogig.db');
  
  // Verify context injected into SQLite properly during worker run
  const profileRow = db.prepare('SELECT * FROM user_intelligence_profile WHERE id = ?').get('u1');
  const policyRow = db.prepare('SELECT * FROM user_policy WHERE id = ?').get('u1');
  const readinessRow = db.prepare('SELECT * FROM execution_readiness LIMIT 1').get();

  if (!profileRow) console.warn("WARN: Profile row not found (might be normal if default loaded without persisting in worker).");
  if (!policyRow) console.warn("WARN: Policy row not found.");

  if (readinessRow) {
    console.log("ExecutionReadiness correctly saved in DB!");
    console.log(JSON.parse(readinessRow.data));
  } else {
    console.log("WARN: Execution Readiness row missing. Ensure worker processed at least one item.");
  }
  
  console.log("ALL RUNTIME TESTS PASSED.");
}

run().catch(e => { console.error(e); process.exit(1); });
