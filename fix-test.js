const fs = require('fs');
let code = fs.readFileSync('tests/phase-f.test.js', 'utf-8');
code = code.replace(/\(src as any\)\.fetchSafe/g, 'src.fetchSafe');
fs.writeFileSync('tests/phase-f.test.js', code);
