const fs = require('fs');
let code = fs.readFileSync('apps/web-api/src/index.ts', 'utf-8');

code = code.replace(
  "const evidence = db.prepare('SELECT * FROM evidence WHERE opportunityId = ?').all(opp.id);",
  `const evidence = db.prepare('SELECT * FROM evidence WHERE opportunityId = ?').all(opp.id);
    const events = db.prepare('SELECT * FROM opportunity_events WHERE opportunityId = ? ORDER BY timestamp ASC').all(opp.id);
    let verificationRuns = [];
    if (proposal) {
      verificationRuns = db.prepare('SELECT * FROM verification_runs WHERE proposalId = ? ORDER BY createdAt ASC').all(proposal.id);
    }`
);

code = code.replace(
  "proposal,",
  "proposal,\n        events,\n        verificationRuns,"
);

fs.writeFileSync('apps/web-api/src/index.ts', code);
