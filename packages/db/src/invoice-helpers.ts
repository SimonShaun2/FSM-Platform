import { and, eq, isNull } from "drizzle-orm";

import { db } from "./client.js";
import { emitEventWithExecutor } from "./events.js";
import { invoices } from "./schema.js";

export type InvoiceOverdueRecord = typeof invoices.$inferSelect;

function buildOverdueSummary(invoiceNumber: string): string {
  return `Invoice ${invoiceNumber} overdue`;
}

export async function markInvoiceOverdueIfNeeded(
  companyId: string,
  invoiceId: string
): Promise<InvoiceOverdueRecord | null> {
  const [existingInvoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.companyId, companyId), eq(invoices.id, invoiceId), isNull(invoices.deletedAt)))
    .limit(1);

  if (!existingInvoice) {
    return null;
  }

  if (existingInvoice.status !== "sent" || !existingInvoice.dueAt || existingInvoice.dueAt.getTime() > Date.now()) {
    return existingInvoice;
  }

  return db.transaction(async (tx) => {
    const updatedInvoices = await tx
      .update(invoices)
      .set({
        status: "overdue",
        updatedAt: new Date()
      })
      .where(and(eq(invoices.companyId, companyId), eq(invoices.id, invoiceId), isNull(invoices.deletedAt)))
      .returning();
    const updatedInvoice = updatedInvoices[0] ?? null;

    if (!updatedInvoice) {
      return null;
    }

    await emitEventWithExecutor(tx, {
      companyId: updatedInvoice.companyId,
      eventType: "invoice.overdue",
      actorType: "system",
      entityType: "invoice",
      entityId: updatedInvoice.id,
      customerId: updatedInvoice.customerId,
      invoiceId: updatedInvoice.id,
      ...(updatedInvoice.jobId ? { jobId: updatedInvoice.jobId } : {}),
      ...(updatedInvoice.estimateId ? { estimateId: updatedInvoice.estimateId } : {}),
      payload: {},
      summary: buildOverdueSummary(updatedInvoice.invoiceNumber)
    });

    return updatedInvoice;
  });
}
