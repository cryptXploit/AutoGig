const fs = require('fs');

const { DatabaseSync } = require('node:sqlite');
const { spawnSync } = require('child_process');
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/test_g47_runtime.db');
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

const db = new DatabaseSync(dbPath);

console.log("Initializing schema...");
require('../packages/db/dist/schema.js').initializeSchema(db);

console.log("Seeding test data...");

// Profile & Pref
db.prepare("INSERT INTO users (id, email) VALUES (?, ?)").run('u1', 'test@test.com');
db.prepare("INSERT INTO profiles (userId, name, skills, resumeKey) VALUES (?, ?, ?, ?)").run('u1', 'Demo', '["node.js", "react", "typescript", "aws"]', 'fake-key');
db.prepare("INSERT INTO preferences (userId, targetRate, minRate, blockedClients, updatedAt) VALUES (?, ?, ?, ?, ?)").run('u1', 100, 50, '["Bad Client Inc"]', new Date().toISOString());

// Opportunity - Good Fit
db.prepare("INSERT INTO opportunities (id, source, sourceJobId, canonicalUrl, title, description, normalizedBudget, normalizedSkills, status, publishedAt, ingestionTimestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
  'opp-g47-1', 'upwork', 'job-g47-1', 'http://example.com', 'Full Stack Node/React', 'Need an expert', 100, '["node.js", "react"]', 'DISCOVERED', new Date().toISOString(), new Date().toISOString()
);

console.log("Running ingestion and opportunity-worker...");

fs.writeFileSync(path.resolve(__dirname, '../data/autogig.db'), fs.readFileSync(dbPath));

const workerRun = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['--workspace=opportunity-worker', 'run', 'start', '--', '--once'], { encoding: 'utf-8', env: process.env });

console.log(workerRun.stdout);
if (workerRun.stderr) console.error(workerRun.stderr);

const resultDb = new DatabaseSync(path.resolve(__dirname, '../data/autogig.db'));
const opp = resultDb.prepare("SELECT * FROM opportunities WHERE id = 'opp-g47-1'").get();
console.log("Opportunity final status:", opp.status);

const plan = resultDb.prepare("SELECT * FROM decision_plans WHERE opportunityId = 'opp-g47-1'").get();
if (!plan) {
  console.error("Decision plan not found!");
  process.exit(1);
}

console.log("Decision Plan:", plan.finalDecision, "| Confidence:", plan.confidence, "| Priority:", plan.priority);

console.assert(plan.finalDecision === 'APPLY_NOW' || plan.finalDecision === 'APPLY_AFTER_REVIEW', "Decision should be APPLY_*");
console.assert(plan.decisionTrace.includes('baseEvaluation'), "Trace must include baseEvaluation");
console.assert(plan.humanApprovalRequired === 1, "Human approval must be required");

console.log("ALL RUNTIME INTEGRATION TESTS PASSED.");
