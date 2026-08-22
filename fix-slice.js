const fs = require('fs');
let code = fs.readFileSync('apps/web-app/app/page.tsx', 'utf-8');
code = code.replace(/setOpps\(oppsRes\.data\.slice\(0, 5\)\);/, 'setOpps(oppsRes.data.slice(0, 10));');
fs.writeFileSync('apps/web-app/app/page.tsx', code);
