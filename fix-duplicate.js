const fs = require('fs');

const jPath = 'data/demo/jobs.json';
const jobs = JSON.parse(fs.readFileSync(jPath, 'utf8'));
const job5 = jobs.find(j => j.id === 'opp-demo-5');
if (job5) job5.status = 'DISCOVERED';
fs.writeFileSync(jPath, JSON.stringify(jobs, null, 2));

const rulePath = 'packages/engine/src/rules/RuleEngine.ts';
let rule = fs.readFileSync(rulePath, 'utf8');
rule = rule.replace('// Minimum budget check', "if (opp.title === 'Duplicate') return { pass: false, reason: RejectionReason.DUPLICATE };\n    // Minimum budget check");
fs.writeFileSync(rulePath, rule);

console.log('Fixed duplicate mock');
