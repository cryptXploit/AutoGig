const fs = require('fs');
let code = fs.readFileSync('packages/db/src/schema.ts', 'utf-8');

code = code.replace(
  "riskTolerance TEXT,",
  `riskTolerance TEXT,
      theme TEXT DEFAULT 'SYSTEM',
      language TEXT DEFAULT 'EN',
      reasoningDepth TEXT DEFAULT 'MEDIUM',
      proposalStrictness TEXT DEFAULT 'MEDIUM',
      evidenceStrictness TEXT DEFAULT 'MEDIUM',
      humanApprovalRequired INTEGER DEFAULT 1,
      learningEnabled INTEGER DEFAULT 1,
      refreshInterval INTEGER DEFAULT 30,`
);

fs.writeFileSync('packages/db/src/schema.ts', code);
