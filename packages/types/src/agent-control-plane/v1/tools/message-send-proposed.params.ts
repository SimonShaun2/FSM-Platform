import { z } from "zod";

import { UuidSchema } from "../zod-shared.js";

export const MessageSendProposedParamsV1Schema = z.object({
  draftProposalId: UuidSchema,
  channel: z.enum(["sms", "email"])
});

export type MessageSendProposedParamsV1 = z.infer<typeof MessageSendProposedParamsV1Schema>;
