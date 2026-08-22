const fs = require('fs');
let content = fs.readFileSync('packages/ai/src/providers/GeminiAIProvider.ts', 'utf8');

const appIntelSchema = `
export const TailoredSkillSchema = z.object({
  name: z.string(),
  relevance: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  reason: z.string(),
  evidenceId: z.string().optional(),
  matchType: z.enum(['DIRECT_MATCH', 'RELATED_MATCH', 'EVIDENCE_WEAK', 'NO_EVIDENCE'])
});

export const ApplicationIntelligenceSchema = z.object({
  tailoredResume: z.array(TailoredSkillSchema),
  screeningAnswers: z.record(z.string(), z.string()),
  suggestedRate: z.number().nullable(),
  suggestedTimeline: z.string(),
  readinessScore: z.number(),
  recommendation: z.enum(['APPLY', 'REVIEW', 'SKIP'])
});
`;

content = content.replace("export const DeepEvaluationSchema", appIntelSchema + "\nexport const DeepEvaluationSchema");

const newMethod = `
  async generateApplicationIntelligence(input: import('@autogig/core').ApplicationIntelligenceInput): Promise<import('@autogig/core').ApplicationIntelligenceResult> {
    const prompt = \`
You are an Evidence-Grounded Application Intelligence Engine.
Your job is to tailor the user's master profile to the provided opportunity, strictly using VERIFIED evidence.

RULES:
1. NEVER INVENT OR FABRICATE skills, experience, or certifications.
2. If a required skill is missing, DO NOT include it in the tailored resume. 
3. Distinguish between DIRECT_MATCH (exact skill in profile + evidence), RELATED_MATCH (evidence supports a related skill), and EVIDENCE_WEAK (in profile but no hard evidence).
4. DO NOT output NO_EVIDENCE skills in the tailored resume unless explicitly explaining a gap.
5. Provide a readiness score (0-100) based on actual technical fit.
6. Provide screening answers ONLY using provided evidence. Mark as INSUFFICIENT_EVIDENCE if unknown.

OPPORTUNITY:
\${JSON.stringify(input.opportunity, null, 2)}

MASTER PROFILE:
\${JSON.stringify(input.profile, null, 2)}

VERIFIED EVIDENCE:
\${JSON.stringify(input.evidence, null, 2)}

EVALUATION CONTEXT:
\${JSON.stringify(input.evaluation, null, 2)}

PREFERENCES:
Target Rate: \${input.preferences.targetRate}, Min Rate: \${input.preferences.minRate}
\`;

    const result = await ai.generate({
      model: 'gemini-1.5-flash',
      prompt: prompt,
      output: {
        schema: ApplicationIntelligenceSchema
      }
    });

    const data = result.output;
    if (!data) throw new Error("Failed to generate application intelligence");
    
    return data as any;
  }
}
`;

content = content.replace("  }\n}", newMethod);
fs.writeFileSync('packages/ai/src/providers/GeminiAIProvider.ts', content, 'utf8');
