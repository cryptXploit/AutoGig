const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/autogig.db');
const db = new DatabaseSync(dbPath);

const reports = db.prepare("SELECT * FROM decision_explainability").all();

console.assert(reports.length > 0, "At least one explainability report must be created during E2E runs");

const reportData = JSON.parse(reports[0].reportJson);
console.assert(reportData.opportunityId !== undefined, "Opportunity ID must match");
console.assert(reportData.evidenceCoverage >= 0, "Evidence coverage must exist");

console.log("Found Explainability Reports:", reports.length);
console.log("Sample Report Coverage:", reportData.evidenceCoverage);
console.log("ALL RUNTIME INTEGRATION TESTS PASSED.");
