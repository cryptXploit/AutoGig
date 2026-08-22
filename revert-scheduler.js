const fs = require('fs');
let code = fs.readFileSync('packages/engine/src/ingestion/LocalScheduler.ts', 'utf-8');
code = code.replace(/const runTask = async \(\) => \{([\s\S]*?)\};\s*const interval = setInterval\(runTask, ms\);\s*setTimeout\(runTask, 0\);/, 
`const interval = setInterval(async () => {
$1
    }, ms);`);
fs.writeFileSync('packages/engine/src/ingestion/LocalScheduler.ts', code);
