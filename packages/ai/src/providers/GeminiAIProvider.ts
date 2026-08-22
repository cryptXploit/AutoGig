
import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { 
  DeepReasoningInput, DeepEvaluationResult, ProposalGenerationInput, Claim, EvidenceContext
} from '@autogig/core';
import { PromptContextBuilder } from '../PromptContextBuilder';
import crypto from 'crypto';

const ai = genkit({
  plugins: [googleAI()]
});

export const DeepEvaluationSchema = z.object({
  opportunityAssessment: z.string(),
  technicalFitReasoning: z.string(),
  economicAssessment: z.string(),
  scopeAssessment: z.string(),
  evidenceAssessment: z.string(),
  clientSignalAssessment: z.string(),
  risks: z.array(z.string()),
  missingInformation: z.array(z.string()),
  recommendedAction: z.enum(['RECOMMEND', 'COUNTER', 'SKIP']),
  priority: z.number(),
  reasoningSummary: z.string(),
  clientRiskAssessment: z.enum(['LOW_RISK', 'ELEVATED_RISK', 'UNKNOWN']).optional()
});

export const ClaimSchema = z.object({
  id: z.string(),
  text: z.string(),
  category: z.enum(['SKILL', 'EXPERIENCE', 'PROJECT', 'METRIC', 'TECHNOLOGY', 'CREDENTIAL']),
  verificationStatus: z.enum(['PASS', 'FLAG', 'BLOCK', 'PENDING']),
  evidenceId: z.string().optional()
});

export const ClaimsBatchSchema = z.object({
  claims: z.array(ClaimSchema)
});


const resolveThinkingLevel = (defaultLevel: string): 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH' => {
  const lvl = (process.env.GEMINI_THINKING_LEVEL || defaultLevel).toUpperCase();
  if (['MINIMAL', 'LOW', 'MEDIUM', 'HIGH'].includes(lvl)) {
    return lvl as 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH';
  }
  return defaultLevel.toUpperCase() as 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH';
};

export class GeminiAIProvider {
  async deepReasoning(input: DeepReasoningInput): Promise<DeepEvaluationResult> {
    const prompt = `
You are an expert autonomous gig evaluator.
${PromptContextBuilder.buildTrustedContext(input.profile, input.preferences)}
${PromptContextBuilder.buildEvidenceContext(input.evidence)}
${PromptContextBuilder.buildUntrustedContext(input.opportunity)}

Based on the evidence and opportunity, output a deep evaluation.
    `;
    const result = await ai.generate({
      prompt,
      model: googleAI.model(process.env.GEMINI_MODEL || 'gemini-3.5-flash'),
      output: { schema: DeepEvaluationSchema },
      config: { thinkingConfig: { thinkingLevel: resolveThinkingLevel('MEDIUM') } }
    });
    return result.output as DeepEvaluationResult;
  }

  async generateProposal(input: ProposalGenerationInput): Promise<string> {
    const prompt = `
${PromptContextBuilder.buildTrustedContext(input.profile, {})}
${PromptContextBuilder.buildEvidenceContext(input.evidence)}
${PromptContextBuilder.buildUntrustedContext(input.opportunity)}

Generate a ${input.decision === 'COUNTER' ? 'counter proposal for negotiation' : 'proposal'} based strictly on the verified profile and evidence.
DO NOT invent skills, years, or projects.
${input.blockedClaims ? '\nWARNING: Avoid these blocked claims: ' + input.blockedClaims.join(', ') : ''}
    `;
    const result = await ai.generate({
      prompt,
      model: googleAI.model(process.env.GEMINI_MODEL || 'gemini-3.5-flash'),
      config: { thinkingConfig: { thinkingLevel: resolveThinkingLevel('LOW') } }
    });
    return result.text;
  }

  async extractClaims(proposalText: string): Promise<Claim[]> {
    const result = await ai.generate({
      prompt: `Extract all factual claims from this proposal.\n\nProposal:\n${proposalText}`,
      model: googleAI.model(process.env.GEMINI_MODEL || 'gemini-3.5-flash'),
      output: { schema: ClaimsBatchSchema },
      config: { thinkingConfig: { thinkingLevel: resolveThinkingLevel('LOW') } }
    });
    return (result.output as { claims: Claim[] }).claims;
  }

  async verifyClaimsBatch(claims: Claim[], evidence: EvidenceContext[]): Promise<Claim[]> {
    const prompt = `
You are a strict factual adjudicator.
${PromptContextBuilder.buildEvidenceContext(evidence)}

Review these claims. If a claim contradicts evidence or invents unverified facts, mark it BLOCK.
Claims: ${JSON.stringify(claims)}
    `;
    const result = await ai.generate({
      prompt,
      model: googleAI.model(process.env.GEMINI_MODEL || 'gemini-3.5-flash'),
      output: { schema: ClaimsBatchSchema },
      config: { thinkingConfig: { thinkingLevel: resolveThinkingLevel('LOW') } }
    });
    return (result.output as { claims: Claim[] }).claims;
  }
}
