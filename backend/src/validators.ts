import { z } from "zod";

export const uploadNotificationSchema = z.object({
  callId: z.string().min(4),
  agentId: z.string().min(1),
  customerId: z.string().optional(),
  recordingPath: z.string().min(5),
  durationSec: z.number().int().nonnegative().optional(),
  fileSizeBytes: z.number().int().positive(),
  uploadedAt: z.string().datetime()
});

export const tokenRequestSchema = z.object({
  callId: z.string().min(4),
  agentId: z.string().min(1),
  recordingFingerprint: z.string().min(8),
  expiresInSec: z.number().int().min(60).max(1800).optional()
});
