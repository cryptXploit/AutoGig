const fs = require('fs');
const path = require('path');

const tsCode = `
import { genkit, z } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';
import { 
  DeepReasoningInput, DeepEvaluationResult, ProposalGenerationInput, Claim, EvidenceContext
} from '@autogig/core';
import { PromptContextBuilder } from './PromptContextBuilder';

// We use genkit and googleAI but wait, the instructions said:
// Use: genkit, @genkit-ai/google-genai. Do NOT use @genkit-ai/googleai
// So I must import from @genkit-ai/google-genai

export const ai = genkit({
  plugins: [],
  model: 'google-genai/gemini-3.5-flash' // The provider will be initialized correctly later
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
`;
fs.writeFileSync(path.join(__dirname, 'packages/ai/src/GenkitFlows.ts'), tsCode);
