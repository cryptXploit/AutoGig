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
  deepReasoning(input: import('../types').DeepReasoningInput): Promise<import('../types').DeepEvaluationResult>;
  generateProposal(input: import('../types').ProposalGenerationInput): Promise<string>;
  extractClaims(proposalText: string): Promise<import('../types').Claim[]>;
  verifyClaimsBatch(claims: import('../types').Claim[], evidence: import('../types').EvidenceContext[]): Promise<import('../types').Claim[]>;
  generateApplicationIntelligence(input: import('../types').ApplicationIntelligenceInput, deterministicRelevance?: any): Promise<import('../types').ApplicationIntelligenceResult>;
  generateClientIntelligence(input: import('../types').ClientIntelligenceInput): Promise<import('../types').ClientIntelligenceResult>;
  generateConversationIntelligence(opportunity: import('../schemas/opportunity').CanonicalOpportunity, profile: import('../types').Profile, preferences: import('../types').Preference, messages: import('../types').ConversationMessage[]): Promise<import('../types').ConversationIntelligence>;
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



