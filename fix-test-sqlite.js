const fs = require('fs');
let code = fs.readFileSync('tests/phase-f.test.js', 'utf-8');
code = code.replace(/const Database = require\('\.\.\/node_modules\/better-sqlite3'\);/g, "const { DatabaseSync } = require('node:sqlite');");
code = code.replace(/const db = new Database\(':memory:'\);/g, "const db = new DatabaseSync(':memory:');");
fs.writeFileSync('tests/phase-f.test.js', code);
