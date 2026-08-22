const fs = require('fs');

let scorerPath = 'packages/engine/src/scoring/OpportunityScorer.ts';
let scorerCode = fs.readFileSync(scorerPath, 'utf8');

scorerCode = scorerCode.replace(/const effectiveRate = ecoResult.effectiveHourlyRate;/g, "const effectiveRate = ecoResult.effectiveHourlyRate ?? ecoResult.targetRate;");
scorerCode = scorerCode.replace(/let budgetFit = 50;/g, "let budgetFit = ecoResult.budgetStatus === 'UNKNOWN' ? 50 : 0;");
scorerCode = scorerCode.replace(/budgetFit = Math\.min\(100, Math\.max\(0, \(effectiveRate \/ ecoResult\.targetRate\) \* 100\)\);/g, "if (ecoResult.budgetStatus === 'KNOWN') budgetFit = Math.min(100, Math.max(0, (effectiveRate / ecoResult.targetRate) * 100));");
fs.writeFileSync(scorerPath, scorerCode);

console.log('Fixed OpportunityScorer');
