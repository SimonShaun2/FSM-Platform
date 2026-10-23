import { z } from "zod";

/** Bridge until ImportEntityType expands on dev — wizard accepts only shipped entity uploads. */
export const importEntityTypeSchema = z.enum(["customers", "jobs"]);

export type WizardImportEntityType = z.infer<typeof importEntityTypeSchema>;
