const fs = require('fs');
let code = fs.readFileSync('apps/web-app/app/opportunity/[id]/page.tsx', 'utf-8');

// Replace Explainable AI Analysis blocks with real persisted data
code = code.replace(
  /<div className="bg-emerald-50\/50 p-4 rounded-xl border border-emerald-100">[\s\S]*?<\/div>/m,
  `<div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200">
     <div className="text-xs font-bold text-slate-500 uppercase mb-2">Automated Explanations</div>
     <p className="text-sm text-slate-800 leading-relaxed">{evaluation.explanations || 'No explanations recorded.'}</p>
   </div>`
);

code = code.replace(
  /<div className="bg-amber-50\/50 p-4 rounded-xl border border-amber-100">[\s\S]*?<\/div>/m,
  `<div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
     <div className="text-xs font-bold text-amber-800 uppercase mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Qualification Flags</div>
     <p className="text-sm text-amber-900 leading-relaxed">
       {evaluation.qualificationFlags && evaluation.qualificationFlags.length > 0 && evaluation.qualificationFlags !== '[]' ? evaluation.qualificationFlags : 'No flags identified.'}
     </p>
   </div>`
);

code = code.replace(
  /<div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4">[\s\S]*?<\/div>/m,
  ''
);

// Replace economic assessment paragraph
code = code.replace(
  /<p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">\s*\{evaluation\.economicAssessment \|\| 'No deep economic analysis available\.'\}\s*<\/p>/m,
  ''
);

fs.writeFileSync('apps/web-app/app/opportunity/[id]/page.tsx', code);
