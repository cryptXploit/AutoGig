const fs = require('fs');

let scorerPath = 'packages/engine/src/scoring/OpportunityScorer.ts';
let code = fs.readFileSync(scorerPath, 'utf8');

code = code.replace(/economics\.effectiveHourlyRate/g, "(economics.effectiveHourlyRate ?? economics.targetRate)");
code = code.replace(/economics\.minimumRateShortfall/g, "(economics.minimumRateShortfall ?? 0)");
code = code.replace(/economics\.budget/g, "(economics.budget ?? 0)");

fs.writeFileSync(scorerPath, code);

let testPath = 'packages/engine/src/scoring/OpportunityScorer.test.ts';
let testCode = fs.readFileSync(testPath, 'utf8');
testCode = testCode.replace(/complexityBand: 'LOW',/g, "budgetStatus: 'KNOWN', complexityBand: 'LOW',");
fs.writeFileSync(testPath, testCode);
