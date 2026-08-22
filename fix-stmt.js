const fs = require('fs');
let code = fs.readFileSync('packages/db/src/repositories/SQLiteOpportunityRepository.ts', 'utf-8');
code = code.replace(
  'opp.publishedAt.toISOString(), opp.ingestionTimestamp.toISOString(), opp.status',
  'opp.publishedAt.toISOString(), opp.ingestionTimestamp.toISOString(), opp.status, opp.uncertainDuplicateReason || null'
);
fs.writeFileSync('packages/db/src/repositories/SQLiteOpportunityRepository.ts', code);
