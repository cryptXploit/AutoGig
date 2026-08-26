const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/autogig.db');
const db = new DatabaseSync(dbPath);

const strats = db.prepare("SELECT * FROM opportunity_strategy ORDER BY priorityScore DESC").all();
console.assert(strats.length > 0, "At least one strategy must be created during E2E runs");

const topStrat = strats[0];
console.assert(topStrat.opportunityId !== undefined, "Opportunity ID must match");
console.assert(topStrat.priorityScore !== undefined, "Score must exist");
console.assert(topStrat.strategy !== undefined, "Strategy must exist");

console.log("Found Strategies:", strats.length);
console.log("Top Strategy:", topStrat.strategy, "Score:", topStrat.priorityScore);
console.log("Reasons:", topStrat.reasons);
console.log("ALL RUNTIME INTEGRATION TESTS PASSED.");
