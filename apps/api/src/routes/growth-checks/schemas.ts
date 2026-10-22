import { z } from "zod";

import {
  createGrowthCheckFindingInputSchema,
  createGrowthCheckIdentityCandidateInputSchema,
  createGrowthCheckInputSchema,
  listGrowthCheckQueueQuerySchema,
  updateGrowthCheckFindingInputSchema,
  updateGrowthCheckIdentityCandidateInputSchema,
  updateGrowthCheckInputSchema
} from "@fsm/types";

import { withZodValidation } from "../shared/validation.js";

export const GrowthCheckParamsSchema = z
  .object({
    id: z.string().uuid()
  })
  .strict();

export type GrowthCheckParams = z.infer<typeof GrowthCheckParamsSchema>;

export type GrowthCheckCandidateParams = z.infer<typeof GrowthCheckCandidateParamsSchema>;

export type GrowthCheckFindingParams = z.infer<typeof GrowthCheckFindingParamsSchema>;

export const GrowthCheckCandidateParamsSchema = z
  .object({
    id: z.string().uuid(),
    candidateId: z.string().uuid()
  })
  .strict();

export const GrowthCheckFindingParamsSchema = z
  .object({
    id: z.string().uuid(),
    findingId: z.string().uuid()
  })
  .strict();

export const listGrowthCheckQueueValidation = withZodValidation({
  query: listGrowthCheckQueueQuerySchema
});

export const createGrowthCheckValidation = withZodValidation({
  body: createGrowthCheckInputSchema
});

export const updateGrowthCheckValidation = withZodValidation({
  params: GrowthCheckParamsSchema,
  body: updateGrowthCheckInputSchema
});

export const growthCheckIdParamsValidation = withZodValidation({
  params: GrowthCheckParamsSchema
});

export const createIdentityCandidateValidation = withZodValidation({
  params: GrowthCheckParamsSchema,
  body: createGrowthCheckIdentityCandidateInputSchema
});

export const updateIdentityCandidateValidation = withZodValidation({
  params: GrowthCheckCandidateParamsSchema,
  body: updateGrowthCheckIdentityCandidateInputSchema
});

export const identityCandidateParamsValidation = withZodValidation({
  params: GrowthCheckCandidateParamsSchema
});

export const createFindingValidation = withZodValidation({
  params: GrowthCheckParamsSchema,
  body: createGrowthCheckFindingInputSchema
});

export const updateFindingValidation = withZodValidation({
  params: GrowthCheckFindingParamsSchema,
  body: updateGrowthCheckFindingInputSchema
});

export const findingParamsValidation = withZodValidation({
  params: GrowthCheckFindingParamsSchema
});
