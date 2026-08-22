const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('./data/autogig.db');
const pending = db.prepare(`SELECT id, status FROM opportunities WHERE status = 'PENDING_APPROVAL' LIMIT 1`).get();
console.log('Pending Opp:', pending);
if (pending) {
  const proposal = db.prepare(`SELECT id, status FROM proposals WHERE opportunityId = ?`).get(pending.id);
  console.log('Proposal:', proposal);
  if (proposal) {
    const claims = db.prepare(`SELECT id, verificationStatus FROM claims WHERE proposalId = ?`).all(proposal.id);
    console.log('Claims:', claims);
  }
  const events = db.prepare(`SELECT previousState, nextState FROM opportunity_events WHERE opportunityId = ? ORDER BY timestamp ASC`).all(pending.id);
  console.log('Events:', events.map(e => `${e.previousState} -> ${e.nextState}`).join(', '));
}
