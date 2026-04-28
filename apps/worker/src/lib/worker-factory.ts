import type { Processor } from "bullmq";
import { Worker } from "bullmq";
import pino from "pino";

import { queueBaseOptions } from "@fsm/jobs";

const workerLogger = pino({
  name: "fsm-worker"
});

export function createWorker<TData extends Record<string, unknown>>(
  queueName: string,
  processor: Processor<TData, void, string>
): Worker<TData, void, string> {
  const logger = workerLogger.child({
    queue: queueName
  });

  const worker = new Worker<TData, void, string>(
    queueName,
    async (job) => {
      logger.info(
        {
          jobId: job.id
        },
        "Worker job started"
      );

      try {
        await processor(job);
        logger.info(
          {
            jobId: job.id
          },
          "Worker job completed"
        );
      } catch (error) {
        logger.error(
          {
            err: error,
            jobId: job.id
          },
          "Worker job failed"
        );
        throw error;
      }
    },
    {
      ...queueBaseOptions
    }
  );

  worker.on("failed", (job, error) => {
    logger.error(
      {
        err: error,
        jobId: job?.id ?? null
      },
      "Worker failure event received"
    );
  });

  return worker;
}
