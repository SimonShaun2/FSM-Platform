import {
  getPlatformQueueMonitoringSnapshot,
  listPlatformDeadLetterJobs,
  listPlatformFailedJobsWithReplayMetadata
} from "@fsm/jobs";
import type {
  DeadLetterJobListV1,
  FailedJobReplayListV1,
  PlatformQueueMonitoringSnapshotV1,
  PlatformQueueNameV1
} from "@fsm/types";

export async function fetchPlatformQueueMonitoringSnapshot(): Promise<PlatformQueueMonitoringSnapshotV1> {
  return getPlatformQueueMonitoringSnapshot();
}

export async function fetchPlatformDeadLetterJobs(
  queueName: PlatformQueueNameV1,
  options: { start?: number; limit?: number; companyId: string }
): Promise<DeadLetterJobListV1> {
  return listPlatformDeadLetterJobs(queueName, options);
}

export async function fetchPlatformFailedJobsWithReplayMetadata(
  queueName: PlatformQueueNameV1,
  options: { companyId: string; start?: number; limit?: number }
): Promise<FailedJobReplayListV1> {
  return listPlatformFailedJobsWithReplayMetadata(queueName, options);
}
