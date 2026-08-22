const fs = require('fs');
let code = fs.readFileSync('packages/ai/src/PromptContextBuilder.ts', 'utf-8');

code = code.replace(
  "Risk Tolerance: ${preferences.riskTolerance || 'MEDIUM'}",
  `Risk Tolerance: \${preferences.riskTolerance || 'MEDIUM'}
Reasoning Depth: \${preferences.reasoningDepth || 'MEDIUM'}
Proposal Strictness: \${preferences.proposalStrictness || 'MEDIUM'}
Evidence Strictness: \${preferences.evidenceStrictness || 'MEDIUM'}
Human Approval Required: \${preferences.humanApprovalRequired !== false}
Learning Enabled: \${preferences.learningEnabled !== false}`
);

fs.writeFileSync('packages/ai/src/PromptContextBuilder.ts', code);
