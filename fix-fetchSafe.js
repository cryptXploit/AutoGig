const fs = require('fs');
let code = fs.readFileSync('apps/ingestion-worker/src/sources/URLSource.ts', 'utf-8');
code = code.replace(/private async fetchSafe/, 'public async fetchSafe');
fs.writeFileSync('apps/ingestion-worker/src/sources/URLSource.ts', code);

let testCode = fs.readFileSync('tests/phase-f.test.js', 'utf-8');
testCode = testCode.replace(/await pipeline\.process\(\{ \.\.\.baseOpp, sourceJobId: 'j3', canonicalUrl: 'http:\/\/c\.com' \}, 's1'\);/, 
  "await pipeline.process({ ...baseOpp, sourceJobId: 'j3', canonicalUrl: 'http://c.com', title: 'T1', description: 'desc exactly the same semantic' }, 's1');"
);
testCode = testCode.replace(/title: 'T1'/, "title: 'T1', publishedAt: new Date(Date.now() - 100000000).toISOString()"); // Change publishedAt so findSimilar fails!
fs.writeFileSync('tests/phase-f.test.js', testCode);
