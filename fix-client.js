const fs = require('fs');
let code = fs.readFileSync('apps/web-app/app/opportunity/[id]/page.tsx', 'utf-8');

code = code.replace(
  "{opportunity.client} • {opportunity.url}",
  "{(typeof opportunity.client === 'string' ? opportunity.client : opportunity.client?.name) || 'Unknown Client'} • {opportunity.url}"
);

fs.writeFileSync('apps/web-app/app/opportunity/[id]/page.tsx', code);
