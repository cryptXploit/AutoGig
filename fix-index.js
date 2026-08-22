const fs = require('fs');
let code = fs.readFileSync('apps/ingestion-worker/src/index.ts', 'utf-8');
code = code.replace(/\/\/ Run once on startup for local tests\/dev/, 
`// Always run once on startup for local test immediate feedback
  await pipeline.run();
  await evidenceIngester.ingestAll();

  // Run once on startup for local tests/dev`);
fs.writeFileSync('apps/ingestion-worker/src/index.ts', code);
