const fs = require('fs');
let content = fs.readFileSync('packages/db/src/schema.ts', 'utf8');

const newTables = `
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      opportunityId TEXT NOT NULL,
      proposalId TEXT,
      tailoredResume TEXT NOT NULL,
      screeningAnswers TEXT NOT NULL,
      suggestedRate REAL,
      suggestedTimeline TEXT,
      readinessScore REAL NOT NULL,
      recommendation TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(opportunityId) REFERENCES opportunities(id),
      FOREIGN KEY(proposalId) REFERENCES proposals(id)
    );

    CREATE TABLE IF NOT EXISTS outcomes (
      id TEXT PRIMARY KEY,
      opportunityId TEXT NOT NULL,
      status TEXT NOT NULL,
      clientResponse TEXT,
      feedback TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(opportunityId) REFERENCES opportunities(id)
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      opportunityId TEXT NOT NULL,
      sender TEXT NOT NULL,
      text TEXT NOT NULL,
      isDraft INTEGER NOT NULL DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(opportunityId) REFERENCES opportunities(id)
    );
  \`);
}`;

content = content.replace("  `);\r\n}", newTables).replace("  `);\n}", newTables);
fs.writeFileSync('packages/db/src/schema.ts', content, 'utf8');
