const fs = require('fs');
const path = require('path');

const write = (relPath, content) => {
    const fullPath = path.join(__dirname, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n');
    console.log(`Updated ${relPath}`);
};

// 1. Upgrade Turborepo
write('package.json', `{
  "name": "autogig",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.3.3"
  }
}`);

// Update turbo.json to tasks format
write('turbo.json', `{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "lint": {},
    "test": {},
    "typecheck": {}
  }
}`);

// 2. Complete State Machine
write('packages/core/src/domain/stateMachine.ts', `
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
`);

// 3 & 4. Shared Types and Removing any
write('packages/core/src/types/index.ts', `
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export interface OpportunityFilters {
  status?: string | string[];
  minScore?: number;
  [key: string]: unknown;
}

export interface Evidence {
  id: string;
  userId: string;
  opportunityId?: string;
  type: 'PDF' | 'IMAGE' | 'TEXT' | 'LINK';
  storageKey: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface Decision {
  id: string;
  opportunityId: string;
  decision: 'SKIP' | 'COUNTER' | 'RECOMMEND' | 'APPROVE' | 'REJECT';
  reason?: string;
  actor: string;
  createdAt: Date;
}

export interface RunDetails {
  runId: string;
  stage: string;
  status: string;
  latency: number;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  errors?: unknown[];
  retryCount?: number;
}

export interface Profile {
  userId: string;
  name?: string;
  skills: string[];
  resumeKey?: string;
}

export interface Preference {
  userId: string;
  targetRate?: number;
  blockedClients?: string[];
  [key: string]: unknown;
}

export interface StorageMetadata {
  size: number;
  contentType: string;
  updatedAt: Date;
  [key: string]: unknown;
}

export interface NotificationAction {
  label: string;
  url?: string;
  payload?: Record<string, unknown>;
}

export interface AIResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  structuredData?: Record<string, unknown>;
}

export interface EmbeddingIndexRequest {
  id: string;
  text: string;
  metadata?: Record<string, unknown>;
}

export interface EmbeddingSearchResult {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}
`);

write('packages/core/src/interfaces/repositories.ts', `
import { CanonicalOpportunity } from '../schemas/opportunity';
import { OpportunityFilters, Evidence, Decision, RunDetails, Profile, Preference } from '../types';

export interface OpportunityRepository {
  findById(id: string): Promise<CanonicalOpportunity | null>;
  save(opportunity: CanonicalOpportunity): Promise<void>;
  list(filters?: OpportunityFilters): Promise<CanonicalOpportunity[]>;
}

export interface EvidenceRepository {
  findById(id: string): Promise<Evidence | null>;
  save(evidence: Evidence): Promise<void>;
}

export interface DecisionRepository {
  save(decision: Decision): Promise<void>;
}

export interface RunRepository {
  saveRun(runDetails: RunDetails): Promise<void>;
}

export interface ProfileRepository {
  getProfile(userId: string): Promise<Profile | null>;
}

export interface PreferenceRepository {
  getPreferences(userId: string): Promise<Preference | null>;
}
`);

write('packages/core/src/interfaces/providers.ts', `
import { EventBusPayload } from '../schemas/events';
import { StorageMetadata, AIResponse, NotificationAction, RunDetails, EmbeddingIndexRequest, EmbeddingSearchResult } from '../types';

export interface ObjectStorage {
  put(key: string, data: Uint8Array | string): Promise<void>;
  get(key: string): Promise<Uint8Array | string | null>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getMetadata(key: string): Promise<StorageMetadata | null>;
}

export interface EventBus {
  publish(event: EventBusPayload): Promise<void>;
  subscribe(eventType: string, handler: (event: EventBusPayload) => Promise<void>): void;
}

export interface Scheduler {
  schedule(jobId: string, cron: string, task: () => Promise<void>): void;
}

export interface AIProvider {
  generateResponse(prompt: string, context?: Record<string, unknown>): Promise<AIResponse>;
}

export interface EmbeddingProvider {
  index(item: EmbeddingIndexRequest): Promise<void>;
  search(vector: number[], topK: number, filters?: Record<string, unknown>): Promise<EmbeddingSearchResult[]>;
  delete(itemId: string): Promise<void>;
}

export interface NotificationProvider {
  send(userId: string, message: string, actions?: NotificationAction[]): Promise<void>;
}

export interface TelemetryProvider {
  recordRun(runDetails: RunDetails): Promise<void>;
}
`);

