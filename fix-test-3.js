const fs = require('fs');
let code = fs.readFileSync('tests/phase-f.test.js', 'utf-8');
code = code.replace(/if \(\!opp\.status \|\| \!opp\.status\.includes\('DISCOVERED'\)\) throw new Error\('Missing status'\);/, "if (!opp.uncertainDuplicateReason) throw new Error('Did not flag uncertain duplicate reason');");
fs.writeFileSync('tests/phase-f.test.js', code);
