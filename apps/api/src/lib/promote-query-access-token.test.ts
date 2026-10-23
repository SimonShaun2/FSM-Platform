import type { FastifyReply, FastifyRequest } from "fastify";
import { describe, expect, it } from "vitest";

import { promoteQueryAccessTokenToHeader } from "./promote-query-access-token.js";

describe("promoteQueryAccessTokenToHeader", () => {
  it("sets Authorization from access_token query when header missing", () => {
    const request = {
      headers: {},
      query: { access_token: "test-jwt" }
    } as FastifyRequest;

    promoteQueryAccessTokenToHeader(request, {} as FastifyReply);
    expect(request.headers.authorization).toBe("Bearer test-jwt");
  });
});
