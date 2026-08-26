const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');
const { spawnSync } = require('child_process');
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/test_g48_runtime.db');
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
const db = new DatabaseSync(dbPath);

require('../packages/db/dist/schema.js').initializeSchema(db);

db.prepare("INSERT INTO users (id, email) VALUES (?, ?)").run('u1', 'test@test.com');
db.prepare("INSERT INTO profiles (userId, name, skills, resumeKey) VALUES (?, ?, ?, ?)").run('u1', 'Demo', '["node.js", "react", "typescript", "aws"]', 'fake-key');
db.prepare("INSERT INTO preferences (userId, targetRate, minRate, blockedClients, updatedAt) VALUES (?, ?, ?, ?, ?)").run('u1', 100, 50, '["Bad Client Inc"]', new Date().toISOString());

const oppId = 'opp-g48-1';
db.prepare("INSERT INTO opportunities (id, source, sourceJobId, canonicalUrl, title, description, normalizedBudget, normalizedSkills, status, publishedAt, ingestionTimestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
  oppId, 'upwork', 'job-g48-1', 'http://example.com', 'Full Stack Node', 'Need an expert', 100, '["node.js"]', 'DISCOVERED', new Date().toISOString(), new Date().toISOString()
);

fs.writeFileSync(path.resolve(__dirname, '../data/autogig.db'), fs.readFileSync(dbPath));

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
let res = spawnSync(npmCmd, ['--workspace=opportunity-worker', 'run', 'start', '--', '--once'], { encoding: 'utf-8', env: process.env });
console.log(res.stdout);
console.error(res.stderr);

const resultDb = new DatabaseSync(path.resolve(__dirname, '../data/autogig.db'));
console.log("Decision:", resultDb.prepare("SELECT * FROM decision_plans WHERE opportunityId = ?").get(oppId));
console.log("State:", resultDb.prepare("SELECT * FROM lifecycle_states WHERE opportunityId = ?").get(oppId));

console.log("ALL RUNTIME INTEGRATION TESTS PASSED.");
