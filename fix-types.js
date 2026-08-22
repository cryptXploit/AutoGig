const fs = require('fs');
let ct = fs.readFileSync('packages/core/src/types/index.ts', 'utf8');

// replace the dynamic imports I added earlier
ct = ct.replace(/import\(".*?"\)\.CanonicalOpportunity/g, 'import("../schemas/opportunity").CanonicalOpportunity');
ct = ct.replace(/import\(".*?"\)\.EvaluationRecord/g, 'EvaluationRecord');
ct = ct.replace(/import\(".*?"\)\.OpportunityProfile/g, 'Profile'); // The type is named Profile, not OpportunityProfile! Let me check the type name!
ct = ct.replace(/import\(".*?"\)\.OpportunityPreferences/g, 'Preference'); // The type is Preference!

fs.writeFileSync('packages/core/src/types/index.ts', ct);

let dr = fs.readFileSync('packages/engine/src/ai/DeepReasoner.ts', 'utf8');
dr = dr.replace(/OpportunityProfile/g, 'Profile').replace(/OpportunityPreferences/g, 'Preference');
fs.writeFileSync('packages/engine/src/ai/DeepReasoner.ts', dr);

let pg = fs.readFileSync('packages/engine/src/ai/ProposalGenerator.ts', 'utf8');
pg = pg.replace(/OpportunityProfile/g, 'Profile');
fs.writeFileSync('packages/engine/src/ai/ProposalGenerator.ts', pg);

let vg = fs.readFileSync('packages/engine/src/ai/VerificationGate.ts', 'utf8');
vg = vg.replace(/OpportunityProfile/g, 'Profile');
fs.writeFileSync('packages/engine/src/ai/VerificationGate.ts', vg);
