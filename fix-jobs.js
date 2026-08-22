const fs = require('fs');
const p = 'data/demo/jobs.json';
const data = JSON.parse(fs.readFileSync(p, 'utf8'));
for (const job of data) {
  job.provenance = "demo";
  job.sourceReliability = 1;
}
fs.writeFileSync(p, JSON.stringify(data, null, 2));
console.log('Fixed jobs.json');
