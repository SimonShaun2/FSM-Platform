import type { FastifyRequest, preValidationHookHandler } from "fastify";
import type { ZodTypeAny } from "zod";

interface ValidationSchemas {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
}

export function withZodValidation(schemas: ValidationSchemas): preValidationHookHandler {
  return async (request: FastifyRequest) => {
    if (schemas.body) {
      request.body = schemas.body.parse(request.body);
    }

    if (schemas.params) {
      request.params = schemas.params.parse(request.params);
    }

    if (schemas.query) {
      request.query = schemas.query.parse(request.query);
    }
  };
}
