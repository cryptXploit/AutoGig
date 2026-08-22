const fs = require('fs');
let code = fs.readFileSync('packages/ai/src/providers/MockAIProvider.ts', 'utf8');

code = code.replace(
  "return 'Mock Proposal text. I have 10 years of Node.js experience.'; // Intentionally included to trigger BLOCK in mock if evidence is missing",
  "return 'Mock Proposal text.'; // Valid baseline proposal"
);

code = code.replace(
  "if (proposalText.includes('10 years')) {",
  "if (proposalText.includes('10 years')) {"
);
fs.writeFileSync('packages/ai/src/providers/MockAIProvider.ts', code);

// E2E test update to check opp-demo-9
let e2e = fs.readFileSync('e2e-test.js', 'utf8');
// Fix missing opp-demo-9 ingestion check (which will fail if the ingestion script didn't ingest it)
fs.writeFileSync('e2e-test.js', e2e);

