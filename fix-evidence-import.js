const fs = require('fs');
let code = fs.readFileSync('packages/db/src/repositories/SQLiteOtherRepositories.ts', 'utf-8');
code = code.replace(/implements import\('@autogig\/core'\)\.EvidenceRepository/, 'implements EvidenceRepository');
if (!code.includes('EvidenceRepository')) {
  code = `import { EvidenceRepository } from '@autogig/core';\n` + code;
} else {
  code = `import { EvidenceRepository, Evidence } from '@autogig/core';\n` + code;
}
code = code.replace(/import\('@autogig\/core'\)\.Evidence/g, 'Evidence');
fs.writeFileSync('packages/db/src/repositories/SQLiteOtherRepositories.ts', code);
