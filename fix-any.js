const fs = require('fs');
let code = fs.readFileSync('apps/web-api/src/index.ts', 'utf-8');

code = code.replace(
  "let verificationRuns = [];",
  "let verificationRuns: any[] = [];"
);

fs.writeFileSync('apps/web-api/src/index.ts', code);
