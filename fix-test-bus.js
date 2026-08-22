const fs = require('fs');
let code = fs.readFileSync('tests/phase-f.test.js', 'utf-8');
code = code.replace(/const \{ EventBusImpl \} = require\('\.\.\/packages\/events\/dist'\);/g, "const { SQLiteEventBus } = require('../packages/events/dist');");
code = code.replace(/const bus = new EventBusImpl\(db\);/g, "const bus = new SQLiteEventBus(db);");
fs.writeFileSync('tests/phase-f.test.js', code);
