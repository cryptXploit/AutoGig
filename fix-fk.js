const fs = require('fs');
let code = fs.readFileSync('packages/db/src/repositories/SQLiteOtherRepositories.ts', 'utf-8');

code = code.replace(
  /this\.db\.prepare\(\`\s+INSERT INTO profiles/g,
  "this.db.prepare(`INSERT OR IGNORE INTO users (id, email) VALUES (?, ?)`).run(profile.userId, profile.userId + '@autogig.com');\n    this.db.prepare(`\n      INSERT INTO profiles"
);

code = code.replace(
  /this\.db\.prepare\(\`\s+INSERT INTO preferences/g,
  "this.db.prepare(`INSERT OR IGNORE INTO users (id, email) VALUES (?, ?)`).run(pref.userId, pref.userId + '@autogig.com');\n    this.db.prepare(`\n      INSERT INTO preferences"
);

fs.writeFileSync('packages/db/src/repositories/SQLiteOtherRepositories.ts', code);
