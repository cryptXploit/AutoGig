const fs = require('fs');
let ow = fs.readFileSync('apps/opportunity-worker/src/index.ts', 'utf8');

// The arguments to evaluate() need casting since they come from the generic SQL row type
ow = ow.replace(
  "const deepResult = await reasoner.evaluate(opp, evaluation, evidenceList, profile, pref);",
  "const deepResult = await reasoner.evaluate(opp as any, evaluation as any, evidenceList as any, profile as any, pref as any);"
);

// also for generator.generate
ow = ow.replace(
  "const propText = await propGen.generate(opp, deepResult, evidenceList, profile, deepResult.recommendedAction);",
  "const propText = await propGen.generate(opp as any, deepResult as any, evidenceList as any, profile as any, deepResult.recommendedAction as 'RECOMMEND' | 'COUNTER');"
);

// and verification gate runVerificationLoop
ow = ow.replace(
  "const vResult = await vGate.runVerificationLoop(propGen, opp, deepResult, profile, propText, evidenceList, 2);",
  "const vResult = await vGate.runVerificationLoop(propGen, opp as any, deepResult as any, profile as any, propText, evidenceList as any, 2);"
);

fs.writeFileSync('apps/opportunity-worker/src/index.ts', ow);
