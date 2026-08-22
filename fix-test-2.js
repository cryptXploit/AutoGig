const fs = require('fs');
let code = fs.readFileSync('tests/phase-f.test.js', 'utf-8');
code = code.replace(/const baseOpp = \{[\s\S]*?\};/, "const baseOpp = { source: 's1', sourceJobId: 'j1', canonicalUrl: 'http://a.com', title: 'T1', description: 'desc', skills: [], publishedAt: new Date().toISOString() };");
code = code.replace(/await pipeline\.process\(\{ \.\.\.baseOpp, sourceJobId: 'j3', canonicalUrl: 'http:\/\/c\.com', title: 'T1', description: 'desc exactly the same semantic' \}, 's1'\);/, "await pipeline.process({ ...baseOpp, sourceJobId: 'j3', canonicalUrl: 'http://c.com', title: 'T1 changed', publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), description: 'desc' }, 's1');");
fs.writeFileSync('tests/phase-f.test.js', code);
