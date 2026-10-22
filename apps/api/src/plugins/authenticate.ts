import type { FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

import { db } from "@fsm/db";
import { AppError, ErrorCode, type UserRole } from "@fsm/types";

import { verifyAccessToken } from "../lib/tokens.js";

interface AuthenticatedRequestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

interface AuthenticatedRequestCompany {
  id: string;
  name: string;
  slug: string;
  timezone: string;
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    user: AuthenticatedRequestUser;
    company: AuthenticatedRequestCompany;
  }
}

const authenticatePlugin = fp(async (fastify) => {
  fastify.decorateRequest("user", null as unknown as AuthenticatedRequestUser);
  fastify.decorateRequest("company", null as unknown as AuthenticatedRequestCompany);

  fastify.decorate("authenticate", async (request: FastifyRequest) => {
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "Missing access token");
    }

    const [scheme, accessToken] = authorizationHeader.split(" ");

    if (scheme !== "Bearer" || !accessToken) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "Malformed access token");
    }

    let verifiedToken: { userId: string; companyId: string; role: string };

    try {
      verifiedToken = verifyAccessToken(accessToken);
    } catch {
      throw new AppError(ErrorCode.UNAUTHORIZED, "Invalid or expired access token");
    }

    const [user, company] = await Promise.all([
      db.query.users.findFirst({
        where: (userTable, operators) =>
          operators.and(
            operators.eq(userTable.id, verifiedToken.userId),
            operators.isNull(userTable.deletedAt)
          )
      }),
      db.query.companies.findFirst({
        where: (companyTable, operators) =>
          operators.and(
            operators.eq(companyTable.id, verifiedToken.companyId),
            operators.isNull(companyTable.deletedAt)
          )
      })
    ]);

    if (!user || !company) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "Invalid or expired access token");
    }

    if (!user.isActive) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "User account is inactive");
    }

    if (user.companyId !== verifiedToken.companyId) {
      throw new AppError(ErrorCode.FORBIDDEN, "Token company does not match user company");
    }

    if (user.companyId !== company.id) {
      throw new AppError(ErrorCode.FORBIDDEN, "User membership does not match company context");
    }

    request.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };
    request.company = {
      id: company.id,
      name: company.name,
      slug: company.slug,
      timezone: company.timezone
    };
  });
});

export default authenticatePlugin;
