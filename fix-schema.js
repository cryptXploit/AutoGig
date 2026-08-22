const fs = require('fs');

let schemaPath = 'packages/db/src/schema.ts';
let schema = fs.readFileSync(schemaPath, 'utf8');

if (!schema.includes('CREATE TABLE IF NOT EXISTS evaluations')) {
  schema = schema.replace('// Create tables', `
  db.exec(\`
    CREATE TABLE IF NOT EXISTS evaluations (
      id TEXT PRIMARY KEY,
      opportunityId TEXT NOT NULL,
      score REAL,
      routingDecision TEXT,
      reason TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(opportunityId) REFERENCES opportunities(id)
    )
  \`);\n// Create tables`);
  fs.writeFileSync(schemaPath, schema);
  console.log('Added evaluations table to schema');
}
