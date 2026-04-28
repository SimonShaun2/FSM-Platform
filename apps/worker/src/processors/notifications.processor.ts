import type { Job } from "bullmq";

export async function processNotifications(_job: Job<Record<string, unknown>>): Promise<void> {}
