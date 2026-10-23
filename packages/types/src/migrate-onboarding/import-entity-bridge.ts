import { z } from "zod";

/** Bridge until ImportEntityType expands on dev — wizard accepts only shipped entity uploads. */
export const importEntityTypeSchema = z.enum(["customers", "properties", "jobs", "estimates"]);

export type WizardImportEntityType = z.infer<typeof importEntityTypeSchema>;
