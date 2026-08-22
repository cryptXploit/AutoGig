const fs = require('fs');
let code = fs.readFileSync('apps/web-api/src/index.ts', 'utf-8');
code = code.replace(/const evaluation = db\.prepare\('SELECT \* FROM evaluations WHERE opportunityId = \?'\)\.get\(opp\.id\);/, `let evaluation = db.prepare('SELECT * FROM evaluations WHERE opportunityId = ?').get(opp.id) as any;
      if (evaluation && typeof evaluation.scoreBreakdown === 'string') {
        const sb = JSON.parse(evaluation.scoreBreakdown);
        evaluation = { ...evaluation, ...sb, explanations: Array.isArray(sb.explanations) ? sb.explanations.join('\\n') : sb.explanations };
      }`);
fs.writeFileSync('apps/web-api/src/index.ts', code);
