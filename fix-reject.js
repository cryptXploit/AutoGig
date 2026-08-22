const fs = require('fs');
let index = fs.readFileSync('apps/web-api/src/index.ts', 'utf8');

index = index.replace(/oppRepo\.get\(/g, 'oppRepo.findById(');

fs.writeFileSync('apps/web-api/src/index.ts', index);
