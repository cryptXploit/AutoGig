const fs = require('fs');
let code = fs.readFileSync('packages/db/src/repositories/SQLiteOtherRepositories.ts', 'utf-8');
code = code.replace(/originalFilename: record\.originalFilename,[\s\S]*?extractionStatus: record\.extractionStatus/, '...record.metadata');
fs.writeFileSync('packages/db/src/repositories/SQLiteOtherRepositories.ts', code);
