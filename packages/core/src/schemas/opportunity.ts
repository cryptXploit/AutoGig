import { z } from 'zod';
import { OpportunityStateSchema } from '../domain/stateMachine';

export const CanonicalOpportunitySchema = z.object({
  id: z.string(),
  source: z.string(),
  sourceJobId: z.string(),
  canonicalUrl: z.string().url(),
  title: z.string(),
  description: z.string(),
  normalizedSkills: z.array(z.string()),
  normalizedBudget: z.number().nullable(),
  deadline: z.date().nullable(),
  client: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    history: z.any().optional() // Extensible based on source
  }),
  provenance: z.string(),
  sourceReliability: z.number().min(0).max(1),
  publishedAt: z.date(),
  ingestionTimestamp: z.date(),
  status: OpportunityStateSchema,
  uncertainDuplicateReason: z.string().optional()
});

export type CanonicalOpportunity = z.infer<typeof CanonicalOpportunitySchema>;


