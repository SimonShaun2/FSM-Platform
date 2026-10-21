import { z } from "zod";

export const MessageDraftParamsV1Schema = z.object({
  channel: z.enum(["sms", "email"]),
  body: z.string().min(1).max(16000),
  subject: z.string().max(998).optional(),
  leadPhase: z.boolean().optional()
});

export type MessageDraftParamsV1 = z.infer<typeof MessageDraftParamsV1Schema>;
