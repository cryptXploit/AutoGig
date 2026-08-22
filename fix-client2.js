const fs = require('fs');
let code = fs.readFileSync('apps/web-app/app/opportunity/[id]/page.tsx', 'utf-8');

code = code.replace(
  /{opportunity\.client}/g,
  "{(typeof opportunity.client === 'string' ? opportunity.client : opportunity.client?.name) || 'Unknown Client'}"
);

fs.writeFileSync('apps/web-app/app/opportunity/[id]/page.tsx', code);
