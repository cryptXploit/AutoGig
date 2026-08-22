const fs = require('fs');
let code = fs.readFileSync('packages/db/src/repositories/SQLiteOtherRepositories.ts', 'utf-8');

code = code.replace(
  "pref.userId,",
  "pref.userId || 'user-local',"
);
code = code.replace(
  "pref.targetRate,",
  "pref.targetRate || 100,"
);
code = code.replace(
  "pref.minRate,",
  "pref.minRate || 50,"
);

fs.writeFileSync('packages/db/src/repositories/SQLiteOtherRepositories.ts', code);
