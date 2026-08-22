const fs = require('fs');
let code = fs.readFileSync('packages/db/src/repositories/SQLiteOpportunityRepository.ts', 'utf-8');
code = code.replace(/status\n\s*\) VALUES \(\?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?\)/, 'status, uncertainDuplicateReason\n        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
code = code.replace(/status = excluded\.status/, 'status = excluded.status, uncertainDuplicateReason = excluded.uncertainDuplicateReason');
code = code.replace(/opp\.ingestionTimestamp\.toISOString\(\),\n\s*opp\.status/, 'opp.ingestionTimestamp.toISOString(),\n        opp.status,\n        opp.uncertainDuplicateReason || null');
code = code.replace(/status: row\.status,/g, 'status: row.status,\n      uncertainDuplicateReason: row.uncertainDuplicateReason,');
fs.writeFileSync('packages/db/src/repositories/SQLiteOpportunityRepository.ts', code);

let schemaCode = fs.readFileSync('packages/db/src/schema.ts', 'utf-8');
schemaCode = schemaCode.replace(/status TEXT NOT NULL/, 'status TEXT NOT NULL,\n  uncertainDuplicateReason TEXT');
fs.writeFileSync('packages/db/src/schema.ts', schemaCode);
