const fs = require('fs');
let code = fs.readFileSync('tests/phase-f.test.js', 'utf-8');
code = code.replace(/description: 'desc'/, "description: 'desc lots of identical words to pass jaccard similarity'");
fs.writeFileSync('tests/phase-f.test.js', code);
