import { and, eq, isNull, sql } from "drizzle-orm";

import { db, invoices } from "@fsm/db";

const INVOICE_NUMBER_PREFIX = "INV-";
const INVOICE_NUMBER_PADDING = 4;
const MAX_INVOICE_NUMBER_WINDOW = 10_000;

type InvoiceNumberExecutor = Pick<typeof db, "select"> &
  Partial<Pick<typeof db, "execute">>;

function parseInvoiceNumberSuffix(invoiceNumber: string | null): number {
  if (!invoiceNumber || !invoiceNumber.startsWith(INVOICE_NUMBER_PREFIX)) {
    return 0;
  }

  const suffix = Number.parseInt(invoiceNumber.slice(INVOICE_NUMBER_PREFIX.length), 10);
  return Number.isFinite(suffix) ? suffix : 0;
}

async function loadLockedInvoiceNumbers(
  executor: InvoiceNumberExecutor,
  companyId: string
): Promise<Array<{ invoiceNumber: string | null }>> {
  if (executor.execute) {
    const result = await executor.execute(
      sql`
        select invoice_number as "invoiceNumber"
        from invoices
        where company_id = ${companyId}
          and deleted_at is null
        order by created_at desc
        for update
      `
    );

    return result as unknown as Array<{ invoiceNumber: string | null }>;
  }

  const rows = await executor
    .select()
    .from(invoices)
    .where(and(eq(invoices.companyId, companyId), isNull(invoices.deletedAt)))
    .limit(MAX_INVOICE_NUMBER_WINDOW);

  return rows.map((row) => ({
    invoiceNumber: row.invoiceNumber
  }));
}

export async function generateInvoiceNumber(
  companyId: string,
  executor: InvoiceNumberExecutor = db
): Promise<string> {
  const rows = await loadLockedInvoiceNumbers(executor, companyId);
  const maxSuffix = rows.reduce((highestSuffix, row) => {
    return Math.max(highestSuffix, parseInvoiceNumberSuffix(row.invoiceNumber));
  }, 0);
  const nextSuffix = maxSuffix + 1;

  return `${INVOICE_NUMBER_PREFIX}${String(nextSuffix).padStart(INVOICE_NUMBER_PADDING, "0")}`;
}
