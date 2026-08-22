const fs = require('fs');
const file = 'apps/opportunity-worker/src/index.ts';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(
  "const prev = db.prepare(`SELECT status FROM opportunities WHERE id = ?`).get(oppId).status;",
  "const prevRow: any = db.prepare(`SELECT status FROM opportunities WHERE id = ?`).get(oppId);\n        const prev = prevRow ? prevRow.status : 'DISCOVERED';"
);
fs.writeFileSync(file, code);
