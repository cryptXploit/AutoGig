const fs = require('fs');
let index = fs.readFileSync('apps/web-api/src/index.ts', 'utf8');

index = index.replace('app.get(''/api/dashboard/stats'', (req, res) => {', 'app.get(''/api/dashboard/stats'', async (req, res) => {');
index = index.replace('app.get(''/api/opportunities'', (req, res) => {', 'app.get(''/api/opportunities'', async (req, res) => {');

index = index.replace(/oppRepo\.list\(\)/g, 'await oppRepo.findAll()');
index = index.replace(/oppRepo\.get\(/g, 'oppRepo.findById(');

fs.writeFileSync('apps/web-api/src/index.ts', index);
