const fs = require('fs');
let code = fs.readFileSync('packages/engine/src/ingestion/LocalScheduler.ts', 'utf-8');
code = code.replace(/const interval = setInterval\(async \(\) => \{([\s\S]*?)\}, ms\);/, `const runTask = async () => {
$1
    };
    const interval = setInterval(runTask, ms);
    setTimeout(runTask, 0);`);
fs.writeFileSync('packages/engine/src/ingestion/LocalScheduler.ts', code);
