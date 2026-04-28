import type { Job } from "bullmq";

export async function processAgreements(_job: Job<Record<string, unknown>>): Promise<void> {}
