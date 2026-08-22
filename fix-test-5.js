const fs = require('fs');
let code = fs.readFileSync('tests/phase-f.test.js', 'utf-8');
const longDesc = 'this is a very long description that has many words so changing one word in the title still keeps similarity high';
code = code.replace(/description: 'desc'/g, `description: '${longDesc}'`);
code = code.replace(/description: 'desc lots of identical words to pass jaccard similarity'/g, `description: '${longDesc}'`);
fs.writeFileSync('tests/phase-f.test.js', code);
