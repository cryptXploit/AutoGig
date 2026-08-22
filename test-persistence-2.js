const http = require('http');

async function testPersistence() {
  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
  
  // 3. GET Profile
  const getProfileRes = await fetch('http://localhost:8080/api/profile');
  const getProfileData = await getProfileRes.json();
  console.log("GET Profile MATCH:", getProfileData.data.name === "Auditor Bot");

  // 4. GET Preference
  const getPrefRes = await fetch('http://localhost:8080/api/preferences');
  const getPrefData = await getPrefRes.json();
  console.log("GET Preference MATCH:", getPrefData.data.preferences.targetRate === 500);

  // Direct DB verification
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync('./data/autogig.db');
  
  const profRow = db.prepare('SELECT * FROM profiles WHERE userId = "user-local"').get();
  console.log("SQLite Profile Name:", profRow.name);

  const prefRow = db.prepare('SELECT * FROM preferences WHERE userId = "user-local"').get();
  console.log("SQLite Pref Risk:", prefRow.riskTolerance);
}

testPersistence().catch(console.error);
