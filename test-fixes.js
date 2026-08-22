const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('./data/autogig.db');

// Check evidence retrieval
const repoPath = './packages/db/dist/repositories/SQLiteOtherRepositories.js';
const evRepo = new (require(repoPath).SQLiteEvidenceRepository)(db);

(async () => {
  const nodeEv = await evRepo.getEvidenceForSkills('u1', ['Node.js']);
  if (nodeEv.length === 0) throw new Error("Missing Node.js evidence");
  
  const javaEv = await evRepo.getEvidenceForSkills('u1', ['Java']);
  if (javaEv.length > 0) throw new Error("Java evidence should be absent");

  // Check unknown budget
  const { EconomicEngine } = require('./packages/engine/dist/index.js');
  const eco = new EconomicEngine();
  const pref = { minRate: 50, targetRate: 100 };
  const oppUnknown = { description: 'test', normalizedBudget: null };
  const resUnknown = eco.calculate(oppUnknown, pref);
  if (resUnknown.budgetStatus !== 'UNKNOWN') throw new Error("Budget should be UNKNOWN");
  if (resUnknown.effectiveHourlyRate !== null) throw new Error("Hourly rate should be null");

  const oppKnown = { description: 'test', normalizedBudget: 0 };
  const resKnown = eco.calculate(oppKnown, pref);
  if (resKnown.budgetStatus !== 'KNOWN') throw new Error("Budget should be KNOWN");
  
  // Check transitions
  const { canTransition } = require('./packages/core/dist/domain/stateMachine.js');
  if (canTransition('DISCOVERED', 'EVALUATING')) throw new Error("Should reject invalid transition");

  // Check Evaluation Record
  const evalRow = db.prepare("SELECT * FROM evaluations WHERE opportunityId = 'opp-demo-1'").get();
  if (!evalRow || evalRow.overall == null || evalRow.technicalFit == null || evalRow.route == null || evalRow.explanations == null) {
     throw new Error("Evaluation record incomplete: " + JSON.stringify(evalRow));
  }

  console.log("All manual validation tests passed!");
})();
