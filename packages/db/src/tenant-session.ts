import { z } from "zod";

const companyIdSchema = z.string().uuid();

/** PostgreSQL custom GUC for RLS policies (STACK-10). Set per transaction/request. */
export const TENANT_SESSION_GUC = "app.current_company_id";

export function buildTenantSessionSetLocal(companyId: string): { sql: string; values: [string] } {
  const parsed = companyIdSchema.parse(companyId);
  return {
    sql: `SELECT set_config('${TENANT_SESSION_GUC}', $1, true)`,
    values: [parsed]
  };
}

export function readTenantCompanyIdFromGucRow(row: { current_setting: string | null }): string | null {
  const value = row.current_setting?.trim();
  if (!value || value === "") {
    return null;
  }
  return companyIdSchema.parse(value);
}
