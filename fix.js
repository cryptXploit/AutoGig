const fs = require('fs');
let code = fs.readFileSync('apps/web-app/app/opportunity/[id]/page.tsx', 'utf-8');
const searchStr = 'export default function OpportunityDetail(';
const replacement = `
import React from 'react';
export default function OpportunityDetail({ params }: { params: { id: string } }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl">Opportunity {params.id}</h1>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div><h2>Economic Analysis</h2><p>Budget vs Rate alignment visualized here.</p></div>
        <div><h2>Verification History</h2><p>Past claim verification traces.</p></div>
        <div><h2>State Transitions</h2><p>History of pipeline state changes.</p></div>
      </div>
    </div>
  );
} //`;
const idx = code.indexOf(searchStr);
if (idx !== -1) {
   code = code.substring(0, idx) + replacement;
   fs.writeFileSync('apps/web-app/app/opportunity/[id]/page.tsx', code);
}
