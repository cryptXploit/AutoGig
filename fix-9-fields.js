const fs = require('fs');
const file = 'data/demo/jobs.json';
let jobs = JSON.parse(fs.readFileSync(file, 'utf8'));
let j9 = jobs.find(j => j.id === 'opp-demo-9');
if (j9) {
    j9.client = { name: "Evil Inc" };
    j9.source = "demo";
    j9.canonicalUrl = "http://e.co/9";
    j9.normalizedSkills = ["Node.js"];
    j9.normalizedBudget = 100;
    j9.provenance = "demo";
    j9.sourceReliability = 1;
    fs.writeFileSync(file, JSON.stringify(jobs, null, 2));
}
