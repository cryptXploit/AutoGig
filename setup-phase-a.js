const fs = require('fs');
const path = require('path');

const write = (relPath, content) => {
    const fullPath = path.join(__dirname, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n');
    console.log(`Created ${relPath}`);
};

// --- ROOT MONOREPO FILES ---

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
    "turbo": "^1.12.4",
    "typescript": "^5.3.3"
  }
}`);

write('turbo.json', `{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "lint": {},
    "test": {},
    "typecheck": {}
  }
}`);

write('tsconfig.base.json', `{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}`);

write('docs/CLOUD_MIGRATION.md', `# Cloud Migration Contract

This document outlines the migration path from local-first development infrastructure to Google Cloud production infrastructure. Core domain/application code must NOT change during this migration.

## Current Local Provider -> Future Google Provider

- \`SQLiteRepository\` -> \`FirestoreRepository\`
- \`LocalObjectStorage\` -> \`GcsObjectStorage\`
- \`LocalEventBus\` -> \`PubSubEventBus\`
- \`LocalScheduler\` -> \`CloudScheduler\`
- \`LocalEmbeddingProvider\` -> \`GeminiEmbeddingProvider\` (Firestore KNN)
- \`LocalAIProvider\` -> \`GeminiAIProvider\` (Vertex AI)
- \`LocalTelemetryProvider\` -> \`CloudLoggingTelemetryProvider\`
- \`LocalNotificationProvider\` -> \`TelegramNotificationProvider\`
`);

write('.env.example', `APP_MODE=local
AI_PROVIDER=mock
EMBEDDING_PROVIDER=local
EVENT_BUS_PROVIDER=local
STORAGE_PROVIDER=local
DATABASE_PROVIDER=sqlite
NOTIFICATION_PROVIDER=local

WEB_APP_URL=http://localhost:3000
WEB_API_URL=http://localhost:8080

DATABASE_URL=./data/autogig.db
LOCAL_STORAGE_PATH=./storage

TELEGRAM_ENABLED=false
`);

write('.env.local', `APP_MODE=local
AI_PROVIDER=mock
EMBEDDING_PROVIDER=local
EVENT_BUS_PROVIDER=local
STORAGE_PROVIDER=local
DATABASE_PROVIDER=sqlite
NOTIFICATION_PROVIDER=local

WEB_APP_URL=http://localhost:3000
WEB_API_URL=http://localhost:8080

DATABASE_URL=./data/autogig.db
LOCAL_STORAGE_PATH=./storage

TELEGRAM_ENABLED=false
`);

// --- PACKAGES/CORE ---

write('packages/core/package.json', `{
  "name": "@autogig/core",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "lint": "echo \\"No linting errors\\"",
    "test": "echo \\"No tests found\\"",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}`);

write('packages/core/tsconfig.json', `{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`);

write('packages/core/src/index.ts', `
export * from './schemas/opportunity';
export * from './schemas/events';
export * from './schemas/config';
export * from './interfaces/repositories';
export * from './interfaces/providers';
export * from './domain/stateMachine';
export * from './types/index';
`);

write('packages/core/src/schemas/opportunity.ts', `
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
  status: OpportunityStateSchema
});

export type CanonicalOpportunity = z.infer<typeof CanonicalOpportunitySchema>;
`);

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
`);

write('packages/core/src/schemas/events.ts', `
import { z } from 'zod';

export const EventBusPayloadSchema = z.object({
  eventId: z.string(),
  eventType: z.string(),
  schemaVersion: z.string().default('1.0'),
  attempt: z.number().default(1),
  createdAt: z.date(),
  payload: z.record(z.any())
});

export type EventBusPayload = z.infer<typeof EventBusPayloadSchema>;
`);

write('packages/core/src/schemas/config.ts', `
import { z } from 'zod';

export const AppConfigSchema = z.object({
  APP_MODE: z.enum(['local', 'production']),
  AI_PROVIDER: z.enum(['mock', 'gemini']),
  EMBEDDING_PROVIDER: z.enum(['local', 'gemini']),
  EVENT_BUS_PROVIDER: z.enum(['local', 'pubsub']),
  STORAGE_PROVIDER: z.enum(['local', 'gcs']),
  DATABASE_PROVIDER: z.enum(['sqlite', 'firestore']),
  NOTIFICATION_PROVIDER: z.enum(['local', 'telegram']),
  DATABASE_URL: z.string().optional(),
  LOCAL_STORAGE_PATH: z.string().optional()
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
`);

write('packages/core/src/interfaces/repositories.ts', `
import { CanonicalOpportunity } from '../schemas/opportunity';

export interface OpportunityRepository {
  findById(id: string): Promise<CanonicalOpportunity | null>;
  save(opportunity: CanonicalOpportunity): Promise<void>;
  list(filters?: any): Promise<CanonicalOpportunity[]>;
}

export interface EvidenceRepository {
  findById(id: string): Promise<any | null>;
  save(evidence: any): Promise<void>;
}

export interface DecisionRepository {
  save(decision: any): Promise<void>;
}

export interface RunRepository {
  saveRun(runDetails: any): Promise<void>;
}

export interface ProfileRepository {
  getProfile(userId: string): Promise<any>;
}

export interface PreferenceRepository {
  getPreferences(userId: string): Promise<any>;
}
`);

write('packages/core/src/interfaces/providers.ts', `
import { EventBusPayload } from '../schemas/events';

export interface ObjectStorage {
  put(key: string, data: Buffer | string): Promise<void>;
  get(key: string): Promise<Buffer | string | null>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getMetadata(key: string): Promise<any>;
}

export interface EventBus {
  publish(event: EventBusPayload): Promise<void>;
  subscribe(eventType: string, handler: (event: EventBusPayload) => Promise<void>): void;
}

export interface Scheduler {
  schedule(jobId: string, cron: string, task: () => Promise<void>): void;
}

export interface AIProvider {
  generateResponse(prompt: string, context?: any): Promise<any>;
}

export interface EmbeddingProvider {
  index(item: any): Promise<void>;
  search(vector: number[], topK: number, filters?: any): Promise<any[]>;
  delete(itemId: string): Promise<void>;
}

export interface NotificationProvider {
  send(userId: string, message: string, actions?: any[]): Promise<void>;
}

export interface TelemetryProvider {
  recordRun(runDetails: {
    runId: string;
    stage: string;
    status: string;
    latency: number;
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    errors?: any[];
    retryCount?: number;
  }): Promise<void>;
}
`);

write('packages/core/src/types/index.ts', `
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };
`);

