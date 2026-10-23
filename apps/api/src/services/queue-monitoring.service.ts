import { getPlatformQueueMonitoringSnapshot } from "@fsm/jobs";
import type { PlatformQueueMonitoringSnapshotV1 } from "@fsm/types";

export async function fetchPlatformQueueMonitoringSnapshot(): Promise<PlatformQueueMonitoringSnapshotV1> {
  return getPlatformQueueMonitoringSnapshot();
}
