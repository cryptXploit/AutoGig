const fs = require('fs');

// 1. Fix types in core/types
let ct = fs.readFileSync('packages/core/src/types/index.ts', 'utf8');
ct = ct.replace(/opportunity: any;/g, 'opportunity: import("./index").CanonicalOpportunity;');
ct = ct.replace(/evaluation: any;/g, 'evaluation: import("./index").EvaluationRecord;');
ct = ct.replace(/profile: any;/g, 'profile: import("./index").OpportunityProfile;');
ct = ct.replace(/preferences: any;/g, 'preferences: import("./index").OpportunityPreferences;');
fs.writeFileSync('packages/core/src/types/index.ts', ct);

// 2. Fix model references and add thinking level support
let aiProv = fs.readFileSync('packages/ai/src/providers/GeminiAIProvider.ts', 'utf8');
aiProv = aiProv.replace(/gemini-1\.5-flash/g, 'gemini-3.5-flash');

// Add thinking config logic
const thinkingReplacer = `
    const thinkingLevel = process.env.GEMINI_THINKING_LEVEL || 'medium';
    // Native Genkit configuration for Gemini thinking blocks (using config.provider depending on API spec)
    const geminiConfig = {
      model: process.env.GEMINI_MODEL || 'google-genai/gemini-3.5-flash',
      config: {
        provider: { thinkingLevel }
      }
    };
`;
aiProv = aiProv.replace(/const result = await ai\.generate\(\{\n\s*prompt,\n\s*model: process\.env\.GEMINI_MODEL \|\| 'google-genai\/gemini-3\.5-flash',\n\s*output: \{ schema: DeepEvaluationSchema \},\n\s*config: \{ temperature: 0\.2 \} \/\/ Thinking level can map to temp or similar configurations\n\s*\}\);/g, 
  "const result = await ai.generate({\n      prompt,\n      model: process.env.GEMINI_MODEL || 'google-genai/gemini-3.5-flash',\n      output: { schema: DeepEvaluationSchema },\n      config: { temperature: 0.2, version: process.env.GEMINI_THINKING_LEVEL || 'medium' }\n    });");

// Actually just rewrite the whole file to be safe and clean!
const newAiProv = `
import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { 
  DeepReasoningInput, DeepEvaluationResult, ProposalGenerationInput, Claim, EvidenceContext
} from '@autogig/core';
import { PromptContextBuilder } from '../PromptContextBuilder';
import crypto from 'crypto';

const ai = genkit({
  plugins: [googleAI()],
  model: 'google-genai/gemini-3.5-flash'
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

export class GeminiAIProvider {
  async deepReasoning(input: DeepReasoningInput): Promise<DeepEvaluationResult> {
    const prompt = \`
You are an expert autonomous gig evaluator.
\${PromptContextBuilder.buildTrustedContext(input.profile, input.preferences)}
\${PromptContextBuilder.buildEvidenceContext(input.evidence)}
\${PromptContextBuilder.buildUntrustedContext(input.opportunity)}

Based on the evidence and opportunity, output a deep evaluation.
    \`;
    const result = await ai.generate({
      prompt,
      model: process.env.GEMINI_MODEL || 'google-genai/gemini-3.5-flash',
      output: { schema: DeepEvaluationSchema },
      config: { temperature: 0.2, version: process.env.GEMINI_THINKING_LEVEL || 'medium' }
    });
    return result.output as DeepEvaluationResult;
  }

  async generateProposal(input: ProposalGenerationInput): Promise<string> {
    const prompt = \`
\${PromptContextBuilder.buildTrustedContext(input.profile, {})}
\${PromptContextBuilder.buildEvidenceContext(input.evidence)}
\${PromptContextBuilder.buildUntrustedContext(input.opportunity)}

Generate a \${input.decision === 'COUNTER' ? 'counter proposal for negotiation' : 'proposal'} based strictly on the verified profile and evidence.
DO NOT invent skills, years, or projects.
\${input.blockedClaims ? '\\nWARNING: Avoid these blocked claims: ' + input.blockedClaims.join(', ') : ''}
    \`;
    const result = await ai.generate({
      prompt,
      model: process.env.GEMINI_MODEL || 'google-genai/gemini-3.5-flash',
      config: { temperature: 0.4, version: process.env.GEMINI_THINKING_LEVEL || 'low' }
    });
    return result.text;
  }

  async extractClaims(proposalText: string): Promise<Claim[]> {
    const result = await ai.generate({
      prompt: \`Extract all factual claims from this proposal.\\n\\nProposal:\\n\${proposalText}\`,
      model: process.env.GEMINI_MODEL || 'google-genai/gemini-3.5-flash',
      output: { schema: ClaimsBatchSchema },
      config: { temperature: 0.1, version: process.env.GEMINI_THINKING_LEVEL || 'low' }
    });
    return (result.output as any).claims;
  }

  async verifyClaimsBatch(claims: Claim[], evidence: EvidenceContext[]): Promise<Claim[]> {
    const prompt = \`
You are a strict factual adjudicator.
\${PromptContextBuilder.buildEvidenceContext(evidence)}

Review these claims. If a claim contradicts evidence or invents unverified facts, mark it BLOCK.
Claims: \${JSON.stringify(claims)}
    \`;
    const result = await ai.generate({
      prompt,
      model: process.env.GEMINI_MODEL || 'google-genai/gemini-3.5-flash',
      output: { schema: ClaimsBatchSchema },
      config: { temperature: 0.1, version: process.env.GEMINI_THINKING_LEVEL || 'low' }
    });
    return (result.output as any).claims;
  }
}
`;
fs.writeFileSync('packages/ai/src/providers/GeminiAIProvider.ts', newAiProv);

// 3. Fix DeepReasoner, ProposalGenerator types
const drCode = `
import { AIProvider, DeepReasoningInput, DeepEvaluationResult, EvidenceContext, CanonicalOpportunity, EvaluationRecord, OpportunityProfile, OpportunityPreferences } from '@autogig/core';

export class DeepReasoner {
  constructor(private ai: AIProvider) {}

  async evaluate(
    opportunity: CanonicalOpportunity, 
    evaluation: EvaluationRecord, 
    evidence: EvidenceContext[], 
    profile: OpportunityProfile, 
    preferences: OpportunityPreferences
  ): Promise<DeepEvaluationResult> {
    const input: DeepReasoningInput = {
       opportunity,
       evaluation,
       evidence,
       profile,
       preferences
    };
    return await this.ai.deepReasoning(input);
  }
}
`;
fs.writeFileSync('packages/engine/src/ai/DeepReasoner.ts', drCode);

const pgCode = `
import { AIProvider, DeepEvaluationResult, EvidenceContext, ProposalGenerationInput, CanonicalOpportunity, OpportunityProfile } from '@autogig/core';

export class ProposalGenerator {
  constructor(private ai: AIProvider) {}

  async generate(
    opportunity: CanonicalOpportunity, 
    reasoning: DeepEvaluationResult, 
    evidence: EvidenceContext[], 
    profile: OpportunityProfile, 
    decision: 'RECOMMEND' | 'COUNTER',
    previousDraft?: string,
    blockedClaims?: string[]
  ): Promise<string> {
    const input: ProposalGenerationInput = {
       opportunity,
       reasoning,
       evidence,
       profile,
       decision,
       previousDraft,
       blockedClaims
    };
    return await this.ai.generateProposal(input);
  }
}
`;
fs.writeFileSync('packages/engine/src/ai/ProposalGenerator.ts', pgCode);

// VerificationGate
const vgCode = fs.readFileSync('packages/engine/src/ai/VerificationGate.ts', 'utf8');
const newVgCode = vgCode.replace(/generator: any,/g, 'generator: import("./ProposalGenerator").ProposalGenerator,')
    .replace(/opp: any,/g, 'opp: import("@autogig/core").CanonicalOpportunity,')
    .replace(/profile: any,/g, 'profile: import("@autogig/core").OpportunityProfile,');
fs.writeFileSync('packages/engine/src/ai/VerificationGate.ts', newVgCode);
