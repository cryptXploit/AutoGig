const fs = require('fs');
let content = fs.readFileSync('apps/web-api/src/index.ts', 'utf8');

const newCode = `
      let claims = [];
      if (proposal) {
        claims = await claimRepo.getClaimsForProposal(proposal.id);
      }
      
      const appRecord = db.prepare('SELECT * FROM applications WHERE opportunityId = ? ORDER BY createdAt DESC LIMIT 1').get(opp.id) as any;
      let applicationIntelligence = null;
      if (appRecord) {
        applicationIntelligence = {
          ...appRecord,
          tailoredResume: JSON.parse(appRecord.tailoredResume),
          screeningAnswers: JSON.parse(appRecord.screeningAnswers)
        };
      }

      const evidence = db.prepare('SELECT * FROM evidence WHERE opportunityId = ?').all(opp.id);
`;

content = content.replace("      let claims = [];\n      if (proposal) {\n        claims = await claimRepo.getClaimsForProposal(proposal.id);\n      }\n      const evidence = db.prepare('SELECT * FROM evidence WHERE opportunityId = ?').all(opp.id);", newCode);

content = content.replace("return res.json({ success: true, data: { ...opp, evaluation, proposal, claims, evidence, events, verificationRuns } });", "return res.json({ success: true, data: { ...opp, evaluation, proposal, claims, applicationIntelligence, evidence, events, verificationRuns } });");

fs.writeFileSync('apps/web-api/src/index.ts', content, 'utf8');
