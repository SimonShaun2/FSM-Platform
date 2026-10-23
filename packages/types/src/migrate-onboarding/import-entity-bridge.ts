import { z } from "zod";

<<<<<<< HEAD
/** Generic migrate wizard uploads — aligned with import_entity_type history + catalog slices. */
export const importEntityTypeSchema = z.enum([
  "customers",
  "properties",
  "jobs",
  "estimates",
  "price_book"
]);
=======
/** Bridge until ImportEntityType expands on dev — wizard accepts only shipped entity uploads. */
export const importEntityTypeSchema = z.enum(["customers", "properties", "jobs", "estimates"]);
>>>>>>> renvani/dev

export type WizardImportEntityType = z.infer<typeof importEntityTypeSchema>;
