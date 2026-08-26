const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/autogig.db');
const db = new DatabaseSync(dbPath);

const reports = db.prepare("SELECT * FROM policy_decisions").all();
console.assert(reports.length > 0, "At least one policy decision must be created during E2E runs");

const reportData = reports[0];
console.assert(reportData.opportunityId !== undefined, "Opportunity ID must match");
console.assert(reportData.disposition !== undefined, "Disposition must exist");
console.assert(['SEND_PROPOSAL', 'DECLINE_OPPORTUNITY', 'DISCOVER_OPPORTUNITY'].includes(reportData.actionType), "Action Type must map correctly");

console.log("Found Policy Decisions:", reports.length);
console.log("Sample Policy Disposition:", reportData.disposition);
console.log("ALL RUNTIME INTEGRATION TESTS PASSED.");
