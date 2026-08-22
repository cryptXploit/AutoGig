const fs = require('fs');

// Seed Evidence in Ingestion Worker
let iwPath = 'apps/ingestion-worker/src/index.ts';
let iwCode = fs.readFileSync(iwPath, 'utf8');
if (!iwCode.includes('INSERT OR IGNORE INTO evidence')) {
  iwCode = iwCode.replace(/for \(const opp of jobs\) \{/, `
  db.prepare("INSERT OR IGNORE INTO evidence (id, userId, type, storageKey, metadata) VALUES (?, ?, ?, ?, ?)").run('ev-1', 'u1', 'CODE_REPO', 'repo/node', JSON.stringify({ skills: ['Node.js'] }));
  db.prepare("INSERT OR IGNORE INTO evidence (id, userId, type, storageKey, metadata) VALUES (?, ?, ?, ?, ?)").run('ev-2', 'u1', 'CODE_REPO', 'repo/ts', JSON.stringify({ skills: ['TypeScript'] }));
  db.prepare("INSERT OR IGNORE INTO evidence (id, userId, type, storageKey, metadata) VALUES (?, ?, ?, ?, ?)").run('ev-3', 'u1', 'CODE_REPO', 'repo/react', JSON.stringify({ skills: ['React'] }));
  for (const opp of jobs) {`);
  fs.writeFileSync(iwPath, iwCode);
}

// Add state transition check in Opportunity Worker
let owPath = 'apps/opportunity-worker/src/index.ts';
let owCode = fs.readFileSync(owPath, 'utf8');
if (!owCode.includes('!canTransition(prev, s)')) {
  owCode = owCode.replace(/const prev = i === 0 \? 'DISCOVERED' : states\[i-1\];/, `const prev = i === 0 ? 'DISCOVERED' : states[i-1];
         if (!canTransition(prev as any, s as any)) throw new Error(\`Invalid transition: \${prev} -> \${s}\`);`);
  fs.writeFileSync(owPath, owCode);
}

console.log('Workers updated');
