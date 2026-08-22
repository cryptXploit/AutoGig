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

