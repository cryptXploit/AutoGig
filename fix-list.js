const fs = require('fs');
let index = fs.readFileSync('apps/web-api/src/index.ts', 'utf8');

index = index.replace(/await oppRepo\.findAll\(\)/g, 'await oppRepo.list()');

fs.writeFileSync('apps/web-api/src/index.ts', index);
