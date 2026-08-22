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

