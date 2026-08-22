const fs = require('fs');
let content = fs.readFileSync('packages/ai/src/providers/MockAIProvider.ts', 'utf8');

const newMethod = `
  async generateApplicationIntelligence(input: import('@autogig/core').ApplicationIntelligenceInput): Promise<import('@autogig/core').ApplicationIntelligenceResult> {
    const oppSkills = input.opportunity.normalizedSkills || [];
    const profSkills = input.profile.skills || [];
    
    // Deterministic matching
    const tailoredResume = oppSkills.map(skill => {
      const isDirect = profSkills.some(ps => ps.toLowerCase() === skill.toLowerCase());
      const hasEvidence = input.evidence.some(e => e.relevantSkills?.includes(skill));
      
      let matchType: 'DIRECT_MATCH' | 'RELATED_MATCH' | 'EVIDENCE_WEAK' | 'NO_EVIDENCE' = 'NO_EVIDENCE';
      if (isDirect && hasEvidence) matchType = 'DIRECT_MATCH';
      else if (isDirect) matchType = 'EVIDENCE_WEAK';
      else if (hasEvidence) matchType = 'RELATED_MATCH';
      
      const evidence = input.evidence.find(e => e.relevantSkills?.includes(skill));
      
      return {
        name: skill,
        relevance: matchType === 'DIRECT_MATCH' ? 'HIGH' : (matchType === 'NO_EVIDENCE' ? 'LOW' : 'MEDIUM'),
        reason: \`Mock reason for \${skill}\`,
        evidenceId: evidence?.evidenceId,
        matchType
      };
    }).filter(t => t.matchType !== 'NO_EVIDENCE'); // Never invent

    // Add remaining profile skills as supporting
    profSkills.forEach(ps => {
      if (!tailoredResume.some(tr => tr.name.toLowerCase() === ps.toLowerCase())) {
        tailoredResume.push({
          name: ps,
          relevance: 'LOW',
          reason: 'Supporting skill from profile',
          matchType: 'DIRECT_MATCH'
        });
      }
    });

    return {
      tailoredResume: tailoredResume as any,
      screeningAnswers: {
        'Mock Question': 'Mock verified answer'
      },
      suggestedRate: input.preferences.targetRate || 100,
      suggestedTimeline: '2 weeks',
      readinessScore: 85,
      recommendation: 'APPLY'
    };
  }
}
`;

content = content.replace("  }\n}", newMethod);
fs.writeFileSync('packages/ai/src/providers/MockAIProvider.ts', content, 'utf8');
