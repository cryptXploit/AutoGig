const fs = require('fs');
let code = fs.readFileSync('tests/phase-f.test.js', 'utf-8');
code = code.replace(/CREATE TABLE opportunities \([\s\S]*?\);/, 'CREATE TABLE opportunities (id TEXT PRIMARY KEY, source TEXT, sourceJobId TEXT, canonicalUrl TEXT, title TEXT, description TEXT, normalizedSkills TEXT, normalizedBudget REAL, deadline TEXT, client TEXT, provenance TEXT, sourceReliability REAL, publishedAt TEXT, ingestionTimestamp TEXT, status TEXT, uncertainDuplicateReason TEXT);');
fs.writeFileSync('tests/phase-f.test.js', code);
