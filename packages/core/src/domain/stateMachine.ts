import { z } from 'zod';

export const OpportunityStateSchema = z.enum([
  'DISCOVERED',
  'NORMALIZED',
  'DEDUPLICATED',
  'FILTERED',
  'RETRIEVING',
  'ENRICHING',
  'EVALUATING',
  'SHORTLISTED',
  'PROPOSAL_GENERATING',
  'VERIFYING',
  'VERIFIED',
  'PENDING_APPROVAL',
  'APPROVED',
  'COUNTERED',
  'REJECTED',
  'FAILED'
]);

export type OpportunityState = z.infer<typeof OpportunityStateSchema>;

export const StateTransitionSchema = z.object({
  previousState: OpportunityStateSchema,
  nextState: OpportunityStateSchema,
  eventId: z.string(),
  actor: z.string(),
  timestamp: z.date(),
  reason: z.string().optional()
});

export type StateTransition = z.infer<typeof StateTransitionSchema>;

const VALID_TRANSITIONS: Record<OpportunityState, OpportunityState[]> = {
  DISCOVERED: ['NORMALIZED', 'FAILED'],
  NORMALIZED: ['DEDUPLICATED', 'FAILED'],
  DEDUPLICATED: ['FILTERED', 'FAILED'],
  FILTERED: ['RETRIEVING', 'FAILED', 'REJECTED'],
  RETRIEVING: ['ENRICHING', 'FAILED'],
  ENRICHING: ['EVALUATING', 'FAILED'],
  EVALUATING: ['SHORTLISTED', 'FAILED', 'REJECTED'],
  SHORTLISTED: ['PROPOSAL_GENERATING', 'FAILED', 'REJECTED'],
  PROPOSAL_GENERATING: ['VERIFYING', 'FAILED'],
  VERIFYING: ['VERIFIED', 'FAILED'],
  VERIFIED: ['PENDING_APPROVAL', 'FAILED'],
  PENDING_APPROVAL: ['APPROVED', 'COUNTERED', 'REJECTED', 'FAILED'],
  APPROVED: ['FAILED'],
  COUNTERED: ['FAILED'],
  REJECTED: [],
  FAILED: []
};

export function canTransition(previousState: OpportunityState, nextState: OpportunityState): boolean {
  return VALID_TRANSITIONS[previousState]?.includes(nextState) ?? false;
}

