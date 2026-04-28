import type { FastifyRequest, preHandlerHookHandler } from "fastify";

import { AppError, ErrorCode, type UserRole } from "@fsm/types";

export function requireRole(allowedRoles: UserRole[]): preHandlerHookHandler {
  return async (request: FastifyRequest) => {
    const currentRole = request.user?.role;

    if (!currentRole || !allowedRoles.includes(currentRole)) {
      throw new AppError(ErrorCode.FORBIDDEN, "You do not have access to this resource");
    }
  };
}
