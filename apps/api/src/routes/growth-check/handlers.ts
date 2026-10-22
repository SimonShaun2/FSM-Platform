import type { FastifyReply, FastifyRequest } from "fastify";

import {
  enqueueGrowthCheckPublicScan,
  getGrowthCheckScan
} from "../../services/growth-check.service.js";
import type { EnqueueGrowthCheckScanBody } from "./schemas.js";

export async function enqueueGrowthCheckScanHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as EnqueueGrowthCheckScanBody;

  const scan = await enqueueGrowthCheckPublicScan(request.company.id, request.user.id, {
    targetUrl: body.targetUrl,
    ...(body.rubricId === undefined ? {} : { rubricId: body.rubricId }),
    ...(body.idempotencyKey === undefined ? {} : { idempotencyKey: body.idempotencyKey })
  });

  return reply.code(201).send(scan);
}

export async function getGrowthCheckScanHandler(request: FastifyRequest, reply: FastifyReply) {
  const { scanId } = request.params as { scanId: string };

  const scan = await getGrowthCheckScan(request.company.id, scanId);

  return reply.send(scan);
}
