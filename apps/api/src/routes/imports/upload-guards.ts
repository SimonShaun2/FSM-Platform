import type { FastifyReply, FastifyRequest } from "fastify";

import { ErrorCode } from "@fsm/types";

import {
  CSV_IMPORT_FILE_TOO_LARGE_MESSAGE,
  CSV_IMPORT_MAX_REQUEST_BODY_BYTES
} from "./upload-limits.js";

export function abortImportUploadRequest(request: FastifyRequest): void {
  const raw = request.raw;

  if (typeof raw.destroy === "function" && !raw.destroyed) {
    raw.destroy();
  }
}

/**
 * Reject oversize CSV imports before multipart parsing (Content-Length is available on headers).
 * Measured overhead for a single `file` field in contract tests is 204 bytes.
 */
export async function rejectOversizedImportBodyByContentLength(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const contentLengthHeader = request.headers["content-length"];

  if (contentLengthHeader === undefined) {
    return;
  }

  const contentLength = Number.parseInt(String(contentLengthHeader), 10);

  if (!Number.isFinite(contentLength)) {
    return;
  }

  if (contentLength > CSV_IMPORT_MAX_REQUEST_BODY_BYTES) {
    await reply.status(413).send({
      error: ErrorCode.VALIDATION_ERROR,
      message: CSV_IMPORT_FILE_TOO_LARGE_MESSAGE,
      requestId: request.id
    });
  }
}
