const { DatabaseSync } = require('node:sqlite');
const { processEvent } = require('../apps/opportunity-worker/dist/index.js');
const { SQLiteOutcomeRepository } = require('../packages/db/dist/repositories/SQLiteOutcomeRepository.js');
const { SQLiteOpportunityRepository } = require('../packages/db/dist/repositories/SQLiteOpportunityRepository.js');
const { SQLiteProfileRepository, SQLitePreferenceRepository, SQLiteEvidenceRepository, SQLiteEvaluationRepository } = require('../packages/db/dist/repositories/SQLiteOtherRepositories.js');
const { SQLiteRunRepository } = require('../packages/db/dist/repositories/SQLiteRunRepository.js');
const { SQLiteEventBus } = require('../packages/events/dist/index.js');
const assert = require('assert');

async function run() {
  console.log('=== Phase G4.6 Runtime Integration Tests ===');

  const db = new DatabaseSync(':memory:');
  require('../packages/db/dist/schema.js').initializeSchema(db);

  db.prepare("INSERT INTO users (id, email) VALUES ('u1', 'test@test.com')").run();
  db.prepare("INSERT INTO profiles (userId, name, skills) VALUES ('u1', 'Test', '[" + '"node.js", "typescript"' + "]')").run();
  db.prepare("INSERT INTO preferences (userId, targetRate, minRate) VALUES ('u1', 100, 50)").run();

  const oppRepo = new SQLiteOpportunityRepository(db);
  const runRepo = new SQLiteRunRepository(db);
  const bus = new SQLiteEventBus(db);
  const profRepo = new SQLiteProfileRepository(db);
  const prefRepo = new SQLitePreferenceRepository(db);
  const evRepo = new SQLiteEvidenceRepository(db);
  const evalRepo = new SQLiteEvaluationRepository(db);
  const outcomeRepo = new SQLiteOutcomeRepository(db);

  const histOppId = 'opp-hist-1';
  db.prepare("INSERT INTO opportunities (id, source, sourceJobId, canonicalUrl, title, description, publishedAt, ingestionTimestamp, status, normalizedSkills, normalizedBudget, client) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(histOppId, 'test', 's-1', 'url1', 'Backend Dev', 'desc', new Date().toISOString(), new Date().toISOString(), 'REJECTED', '["node.js", "typescript"]', 120, JSON.stringify({id: 'good-client', name: 'Excellent fit'}));
  
  db.prepare("INSERT INTO evaluations (id, opportunityId, route, overall, technicalFit, budgetFit) VALUES (?, ?, ?, ?, ?, ?)").run('eval-hist-1', histOppId, 'RECOMMEND', 80, 90, 100);
  
  outcomeRepo.save({
    id: 'out-1',
    opportunityId: histOppId,
    status: 'WON',
    createdAt: new Date()
  });

  const newOppId = 'opp-new-1';
  db.prepare("INSERT INTO opportunities (id, source, sourceJobId, canonicalUrl, title, description, publishedAt, ingestionTimestamp, status, normalizedSkills, normalizedBudget, client) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(newOppId, 'test', 's-2', 'url2', 'Backend API', 'desc2', new Date().toISOString(), new Date().toISOString(), 'DISCOVERED', '["node.js", "typescript"]', 120, JSON.stringify({id: 'good-client', name: 'Excellent fit'}));
  
  db.prepare("INSERT INTO event_queue (eventId, eventType, payload) VALUES (?, ?, ?)").run('evt-1', 'OPPORTUNITY_DISCOVERED', JSON.stringify({opportunityId: newOppId}));

  console.log('Running worker for TEST B...');
  const event1 = bus.claimPending();
  if (event1) {
    await processEvent(db, oppRepo, runRepo, bus, profRepo, prefRepo, evRepo, evalRepo, event1);
  }

  
  const event1_2 = bus.claimPending();
  if (event1_2) {
    console.log('Running worker for TEST B (Deep Reason)...', event1_2.eventType);
    await processEvent(db, oppRepo, runRepo, bus, profRepo, prefRepo, evRepo, evalRepo, event1_2);
  }

  let evalRecord = db.prepare('SELECT * FROM evaluations WHERE opportunityId = ?').get(newOppId);
  console.log('Persisted Evaluation for TEST B:', evalRecord);
  assert.ok(evalRecord.historicalIntelligence, 'historicalIntelligence must be persisted');
  assert.ok(evalRecord.finalScore !== null, 'finalScore must be persisted');
  const histIntel = JSON.parse(evalRecord.historicalIntelligence);
  assert.ok(histIntel.historicalSuccessAdjustment > 0, 'Adjustment should be positive due to WON history');

  const rejectOppId = 'opp-reject-1';
  db.prepare("INSERT INTO opportunities (id, source, sourceJobId, canonicalUrl, title, description, publishedAt, ingestionTimestamp, status, normalizedSkills, normalizedBudget, client) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(rejectOppId, 'test', 's-3', 'url3', 'Backend API Reject', 'desc3', new Date().toISOString(), new Date().toISOString(), 'DISCOVERED', '[]', 10, JSON.stringify({id: 'good-client', name: 'good-client'}));
  
  db.prepare("INSERT INTO event_queue (eventId, eventType, payload) VALUES (?, ?, ?)").run('evt-2', 'OPPORTUNITY_DISCOVERED', JSON.stringify({opportunityId: rejectOppId}));

  console.log('Running worker for TEST E...');
  const event2 = bus.claimPending();
  if (event2) {
    await processEvent(db, oppRepo, runRepo, bus, profRepo, prefRepo, evRepo, evalRepo, event2);
  }

  let evalRecordReject = db.prepare('SELECT * FROM evaluations WHERE opportunityId = ?').get(rejectOppId);
  console.log('Persisted Evaluation for TEST E:', evalRecordReject);
  assert.strictEqual(evalRecordReject.route, 'REJECT');
  const histIntelReject = JSON.parse(evalRecordReject.historicalIntelligence);
  assert.strictEqual(histIntelReject.historicalSuccessAdjustment, 0, 'Adjustment must be 0 for REJECT');
  assert.ok(histIntelReject.explanation.includes('No historical intelligence') || histIntelReject.explanation.includes('Hard rejection'), 'Must contain rejection explanation');
  
  console.log('ALL RUNTIME INTEGRATION TESTS PASSED.');
}

run().catch(console.error);
