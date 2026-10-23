import type { ImportSourcePreset } from "./types.js";

/**
 * Housecall Pro quirks (M1):
 * - Customer export prefixes columns with "Customer …".
 * - Job export is a separate CSV with job id, customer link, and schedule fields.
 */
export const HOUSECALL_PRO_PRESETS: ImportSourcePreset[] = [
  {
    id: "housecall_pro",
    entity: "customers",
    label: "Housecall Pro (customers)",
    headerAliases: {
      "customer first name": "firstName",
      "customer last name": "lastName",
      "customer email": "email",
      "customer phone": "phone",
      company: "company",
      "home number": "altPhone",
      "mobile number": "phone",
      "service address": "addressLine1",
      "street address": "addressLine1",
      city: "city",
      state: "state",
      zip: "zip"
    }
  },
  {
    id: "housecall_pro_jobs",
    entity: "customers",
    label: "Housecall Pro (jobs)",
    headerAliases: {
      "job id": "sourceId",
      "job uuid": "sourceId",
      "customer uuid": "customerSourceId",
      "customer id": "customerSourceId",
      "scheduled date": "scheduledAt",
      "job status": "status",
      status: "status",
      "job type": "jobType",
      street: "addressLine1",
      city: "city",
      state: "state",
      zip: "zip",
      "total amount": "total"
    }
  }
];
