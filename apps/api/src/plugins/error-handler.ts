import type { FastifyError } from "fastify";
import fp from "fastify-plugin";
import { ZodError } from "zod";

import { AppError, ErrorCode, getHttpStatusForErrorCode } from "@fsm/types";

function mapZodFields(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path.join(".") || "root";
    if (!(key in fields)) {
      fields[key] = issue.message;
    }
  }

  return fields;
}

const errorHandlerPlugin = fp(async (fastify) => {
  fastify.setErrorHandler((error: FastifyError | Error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(getHttpStatusForErrorCode(error.code)).send({
        error: error.code,
        message: error.message,
        requestId: request.id,
        fields: error.fields
      });
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: ErrorCode.VALIDATION_ERROR,
        message: "Request validation failed",
        requestId: request.id,
        fields: mapZodFields(error)
      });
    }

    request.log.error(
      {
        err: error,
        requestId: request.id,
        companyId: request.company?.id ?? null,
        userId: request.user?.id ?? null
      },
      "Unhandled request error"
    );

    return reply.status(500).send({
      error: ErrorCode.INTERNAL_ERROR,
      message: "Internal server error",
      requestId: request.id
    });
  });
});

export default errorHandlerPlugin;
