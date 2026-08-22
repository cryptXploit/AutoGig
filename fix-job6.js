const fs = require('fs');

const jPath = 'data/demo/jobs.json';
const jobs = JSON.parse(fs.readFileSync(jPath, 'utf8'));
const job6 = jobs.find(j => j.id === 'opp-demo-6');
if (job6) {
  job6.normalizedSkills = ['TypeScript'];
  job6.description = 'Need a developer.';
}
fs.writeFileSync(jPath, JSON.stringify(jobs, null, 2));

console.log('Fixed job 6');
