const fs = require('fs');
let code = fs.readFileSync('apps/web-api/src/index.ts', 'utf-8');
code = code.replace(/const runRows = db\.prepare\('SELECT \* FROM runs ORDER BY createdAt DESC LIMIT 50'\)\.all\(\);/,
`const runRows = db.prepare('SELECT s.runId, s.stage, s.status, s.latency, s.startedAt, s.endedAt, s.error, s.retryCount FROM run_stages s ORDER BY s.startedAt DESC LIMIT 100').all();`);
fs.writeFileSync('apps/web-api/src/index.ts', code);
