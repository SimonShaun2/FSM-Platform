import { getPlatformQueueMonitoringSnapshot, listPlatformDeadLetterJobs } from "@fsm/jobs";
import type { DeadLetterJobListV1, PlatformQueueMonitoringSnapshotV1, PlatformQueueNameV1 } from "@fsm/types";

export async function fetchPlatformQueueMonitoringSnapshot(): Promise<PlatformQueueMonitoringSnapshotV1> {
  return getPlatformQueueMonitoringSnapshot();
}

export async function fetchPlatformDeadLetterJobs(
  queueName: PlatformQueueNameV1,
  options: { start?: number; limit?: number } = {}
): Promise<DeadLetterJobListV1> {
  return listPlatformDeadLetterJobs(queueName, options);
}
