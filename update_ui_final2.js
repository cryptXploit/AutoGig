const fs = require('fs');
const aiSection = fs.readFileSync('ai_section.txt', 'utf8');
let content = fs.readFileSync('apps/web-app/app/opportunity/[id]/page.tsx', 'utf8');

if (!content.includes('Application Intelligence Console')) {
  content = content.replace("{/* 3. Evidence -> Claim -> Verification Trace */}", aiSection);
  fs.writeFileSync('apps/web-app/app/opportunity/[id]/page.tsx', content, 'utf8');
}
