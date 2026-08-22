const fs = require('fs');
let code = fs.readFileSync('apps/web-app/app/settings/page.tsx', 'utf-8');
code = code.replace("fetch('/api/preferences'", "fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'}/api/preferences`");
fs.writeFileSync('apps/web-app/app/settings/page.tsx', code);
