const fs = require('fs');
let content = fs.readFileSync('apps/opportunity-worker/src/index.ts', 'utf8');

// Add imports
if (!content.includes('ApplicationIntelligenceEngine')) {
  content = content.replace("RuleEngine, LocalSimilarityRetriever, EconomicEngine, OpportunityScorer, DeepReasoner, ProposalGenerator, VerificationGate", 
    "RuleEngine, LocalSimilarityRetriever, EconomicEngine, OpportunityScorer, DeepReasoner, ProposalGenerator, VerificationGate, ApplicationIntelligenceEngine");
}
if (!content.includes('SQLiteApplicationRepository')) {
  content = content.replace("SQLiteVerificationRepository", "SQLiteVerificationRepository,\n  SQLiteApplicationRepository");
}

const newLogic = `
    const propText = await propGen.generate(opp as any, deepResult as any, evidenceList as any, profile as any, deepResult.recommendedAction as 'RECOMMEND' | 'COUNTER');
    const proposalId = \`prop-\${oppId}-1\`;
    
    // --- G4.2 Application Intelligence ---
    const appIntelEngine = new ApplicationIntelligenceEngine(ai);
    const appIntelResult = await appIntelEngine.generate({
      opportunity: opp as any,
      profile: profile as any,
      preferences: pref as any,
      evidence: evidenceList as any,
      evaluation: deepResult as any
    });

    const appRepo = new SQLiteApplicationRepository(db);
    appRepo.save({
      id: \`app-\${oppId}-1\`,
      opportunityId: oppId,
      proposalId: proposalId,
      ...appIntelResult,
      createdAt: new Date()
    });
    // ------------------------------------

    await proposalRepo.saveProposal({
`;

content = content.replace(`    const propText = await propGen.generate(opp as any, deepResult as any, evidenceList as any, profile as any, deepResult.recommendedAction as 'RECOMMEND' | 'COUNTER');\n    const proposalId = \`prop-\${oppId}-1\`;\n    \n    await proposalRepo.saveProposal({`, newLogic);

fs.writeFileSync('apps/opportunity-worker/src/index.ts', content, 'utf8');
