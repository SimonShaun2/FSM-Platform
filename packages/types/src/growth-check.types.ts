import { z } from "zod";

export const growthCheckStatusSchema = z.enum([
  "intake_draft",
  "queued",
  "scanning",
  "review_needed",
  "completed",
  "archived"
]);

export type GrowthCheckStatus = z.infer<typeof growthCheckStatusSchema>;

export const growthCheckIdentitySourceSchema = z.enum([
  "manual",
  "website",
  "google_business",
  "facebook",
  "import",
  "ai"
]);

export type GrowthCheckIdentitySource = z.infer<typeof growthCheckIdentitySourceSchema>;

export const growthCheckFindingSeveritySchema = z.enum(["info", "low", "medium", "high", "critical"]);

export type GrowthCheckFindingSeverity = z.infer<typeof growthCheckFindingSeveritySchema>;

export const growthCheckFindingStatusSchema = z.enum(["open", "acknowledged", "resolved", "dismissed"]);

export type GrowthCheckFindingStatus = z.infer<typeof growthCheckFindingStatusSchema>;

export const createGrowthCheckInputSchema = z.object({
  businessName: z.string().trim().min(1).max(255),
  websiteUrl: z.string().trim().url().max(500).optional().nullable(),
  industry: z.string().trim().max(120).optional().nullable(),
  trade: z.string().trim().max(120).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(50).optional().nullable(),
  zip: z.string().trim().max(20).optional().nullable(),
  contactName: z.string().trim().max(255).optional().nullable(),
  contactEmail: z.string().trim().email().max(255).optional().nullable(),
  contactPhone: z.string().trim().max(30).optional().nullable(),
  targetMarket: z.string().trim().max(5000).optional().nullable(),
  googleBusinessProfileUrl: z.string().trim().url().max(500).optional().nullable(),
  facebookPageUrl: z.string().trim().url().max(500).optional().nullable(),
  intakeNotes: z.string().trim().max(10000).optional().nullable(),
  ownerUserId: z.string().uuid().optional(),
  status: growthCheckStatusSchema.optional()
});

export type CreateGrowthCheckInput = z.infer<typeof createGrowthCheckInputSchema>;

export const updateGrowthCheckInputSchema = z
  .object({
    status: growthCheckStatusSchema.optional(),
    ownerUserId: z.string().uuid().optional(),
    reviewNeeded: z.boolean().optional(),
    lastScanAt: z.string().datetime().optional().nullable(),
    businessName: z.string().trim().min(1).max(255).optional(),
    websiteUrl: z.string().trim().url().max(500).optional().nullable(),
    industry: z.string().trim().max(120).optional().nullable(),
    trade: z.string().trim().max(120).optional().nullable(),
    city: z.string().trim().max(100).optional().nullable(),
    state: z.string().trim().max(50).optional().nullable(),
    zip: z.string().trim().max(20).optional().nullable(),
    contactName: z.string().trim().max(255).optional().nullable(),
    contactEmail: z.string().trim().email().max(255).optional().nullable(),
    contactPhone: z.string().trim().max(30).optional().nullable(),
    targetMarket: z.string().trim().max(5000).optional().nullable(),
    googleBusinessProfileUrl: z.string().trim().url().max(500).optional().nullable(),
    facebookPageUrl: z.string().trim().url().max(500).optional().nullable(),
    intakeNotes: z.string().trim().max(10000).optional().nullable()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export type UpdateGrowthCheckInput = z.infer<typeof updateGrowthCheckInputSchema>;

export const createGrowthCheckIdentityCandidateInputSchema = z.object({
  displayName: z.string().trim().min(1).max(255),
  domain: z.string().trim().max(255).optional().nullable(),
  source: growthCheckIdentitySourceSchema.optional(),
  confidenceScore: z.number().min(0).max(1).optional().nullable(),
  isPrimary: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional()
});

export type CreateGrowthCheckIdentityCandidateInput = z.infer<
  typeof createGrowthCheckIdentityCandidateInputSchema
>;

export const updateGrowthCheckIdentityCandidateInputSchema = z
  .object({
    displayName: z.string().trim().min(1).max(255).optional(),
    domain: z.string().trim().max(255).optional().nullable(),
    source: growthCheckIdentitySourceSchema.optional(),
    confidenceScore: z.number().min(0).max(1).optional().nullable(),
    isPrimary: z.boolean().optional(),
    metadata: z.record(z.unknown()).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export type UpdateGrowthCheckIdentityCandidateInput = z.infer<
  typeof updateGrowthCheckIdentityCandidateInputSchema
>;

export const createGrowthCheckFindingInputSchema = z.object({
  category: z.string().trim().min(1).max(100),
  severity: growthCheckFindingSeveritySchema.optional(),
  status: growthCheckFindingStatusSchema.optional(),
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(10000).optional().nullable(),
  recommendation: z.string().trim().max(10000).optional().nullable(),
  evidence: z.record(z.unknown()).optional()
});

export type CreateGrowthCheckFindingInput = z.infer<typeof createGrowthCheckFindingInputSchema>;

export const updateGrowthCheckFindingInputSchema = z
  .object({
    category: z.string().trim().min(1).max(100).optional(),
    severity: growthCheckFindingSeveritySchema.optional(),
    status: growthCheckFindingStatusSchema.optional(),
    title: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().max(10000).optional().nullable(),
    recommendation: z.string().trim().max(10000).optional().nullable(),
    evidence: z.record(z.unknown()).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export type UpdateGrowthCheckFindingInput = z.infer<typeof updateGrowthCheckFindingInputSchema>;

export const listGrowthCheckQueueQuerySchema = z.object({
  status: growthCheckStatusSchema.optional(),
  reviewNeeded: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
  ownerUserId: z.string().uuid().optional()
});

export type ListGrowthCheckQueueQuery = z.infer<typeof listGrowthCheckQueueQuerySchema>;
