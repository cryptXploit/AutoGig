const fs = require('fs');
let code = fs.readFileSync('apps/ingestion-worker/src/sources/URLSource.ts', 'utf-8');
code = code.replace(/lookup: \(hostname, options, callback\) => \{[\s\S]*?callback\(null, addresses.address, addresses.family\);\s*\}/, 
`lookup: (hostname, options, callback) => {
          if (options.all) {
            callback(null, [{ address: addresses.address, family: addresses.family }]);
          } else {
            callback(null, addresses.address, addresses.family);
          }
        }`);
fs.writeFileSync('apps/ingestion-worker/src/sources/URLSource.ts', code);
