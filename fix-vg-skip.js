const fs = require('fs');
let vg = fs.readFileSync('packages/engine/src/ai/VerificationGate.ts', 'utf8');
vg = vg.replace(
  "currentDraft = await generator.generate(opp, deepResult, evidence, profile, deepResult.recommendedAction, currentDraft, blockedClaims);",
  "currentDraft = await generator.generate(opp, deepResult, evidence, profile, deepResult.recommendedAction as 'RECOMMEND' | 'COUNTER', currentDraft, blockedClaims);"
);
fs.writeFileSync('packages/engine/src/ai/VerificationGate.ts', vg);
