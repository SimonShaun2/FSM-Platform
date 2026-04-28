import type { Job } from "bullmq";

export async function processInvoiceReminder(_job: Job<Record<string, unknown>>): Promise<void> {}
