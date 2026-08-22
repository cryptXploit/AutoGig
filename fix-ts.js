const fs = require('fs');
let code = fs.readFileSync('apps/web-app/app/settings/page.tsx', 'utf-8');
code = code.replace("prev => ({ ...prev", "(prev: any) => ({ ...prev");
fs.writeFileSync('apps/web-app/app/settings/page.tsx', code);
