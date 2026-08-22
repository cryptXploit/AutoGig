const fs = require('fs');
let code = fs.readFileSync('tests/e2e.js', 'utf-8');
code = code.replace(/const db = new DatabaseSync\(':memory:'\);/, "const db = new DatabaseSync('./data/autogig.db');");
fs.writeFileSync('tests/e2e-seed.js', code);
