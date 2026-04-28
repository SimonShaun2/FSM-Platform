import type { FastifyReply, FastifyRequest } from "fastify";

import { verifyRefreshToken } from "../../lib/tokens.js";
import { getCompany } from "../../services/company.service.js";
import {
  forgotPassword,
  login,
  logout,
  refresh,
  register,
  resetPassword
} from "../../services/auth.service.js";
import type {
  ForgotPasswordInput,
  LoginInput,
  LogoutInput,
  RefreshInput,
  RegisterInput,
  ResetPasswordInput
} from "./schemas.js";

function toUserResponse(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role
  };
}

export async function registerHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const result = await register(request.body as RegisterInput);

  return reply.status(201).send({
    user: toUserResponse(result.user),
    company: {
      id: result.company.id,
      name: result.company.name,
      slug: result.company.slug
    },
    tokens: result.tokens
  });
}

export async function loginHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const result = await login(request.body as LoginInput);
  const company = await getCompany(result.user.companyId);

  return reply.send({
    user: toUserResponse(result.user),
    company: {
      id: company.id,
      name: company.name
    },
    tokens: result.tokens
  });
}

export async function refreshHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const body = request.body as RefreshInput;
  const result = await refresh(body.refreshToken);

  return reply.send({
    tokens: result.tokens
  });
}

export async function logoutHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const body = request.body as LogoutInput;
  const payload = verifyRefreshToken(body.refreshToken);
  await logout(payload.userId, body.refreshToken);

  return reply.status(204).send();
}

export async function forgotPasswordHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const body = request.body as ForgotPasswordInput;
  await forgotPassword(body.email);

  return reply.send({
    message: "If that email exists, a reset link has been sent."
  });
}

export async function resetPasswordHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const body = request.body as ResetPasswordInput;
  await resetPassword(body.resetToken, body.newPassword);

  return reply.send({
    message: "Password updated successfully."
  });
}
