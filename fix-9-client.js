const fs = require('fs');
const file = 'data/demo/jobs.json';
let jobs = JSON.parse(fs.readFileSync(file, 'utf8'));
let j9 = jobs.find(j => j.id === 'opp-demo-9');
if (j9) {
    j9.client = { name: "Evil Inc" };
    fs.writeFileSync(file, JSON.stringify(jobs, null, 2));
}
