const http = require('http');

async function testPersistence() {
  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
  
  // Create an explicit mock profile to PUT
  const newProfile = {
    name: "Auditor Bot",
    skills: ["Audit", "Freeze"],
    experience: ["1 year Auditing"],
    projects: ["Project 1"],
    certifications: ["Cert 1"],
    preferredTechnologies: ["TypeScript"]
  };

  const newPref = {
    targetRate: 500,
    minRate: 400,
    blockedClients: ["Bad Corp"],
    preferredProjectTypes: ["Audit tasks"],
    riskTolerance: "LOW"
  };

  // 1. PUT Profile
  const putProfileRes = await fetch('http://localhost:8080/api/profile', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newProfile)
  });
  const putProfileData = await putProfileRes.json();
  console.log("PUT Profile Response:", putProfileData);

  // 2. PUT Preference
  const putPrefRes = await fetch('http://localhost:8080/api/preferences', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newPref)
  });
  const putPrefData = await putPrefRes.json();
  console.log("PUT Preference Response:", putPrefData);
}

testPersistence().catch(console.error);
