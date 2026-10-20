import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { isPublicEstimateTokenValid, resolveLegacyEstimateGetRecovery } from "./legacy-estimate-route";

const VALID_TOKEN = "x".repeat(32);
const UNKNOWN_TOKEN = "z".repeat(32);

describe("legacy estimate recovery against HTTP stub (FS-36)", () => {
  let server: Server;
  let apiBaseUrl: string;

  beforeAll(async () => {
    server = createServer((request, response) => {
      const url = request.url ?? "";

      if (request.method === "GET" && url === `/api/v1/public/estimates/${VALID_TOKEN}`) {
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ estimate: { status: "sent" } }));
        return;
      }

      if (request.method === "GET" && url.startsWith("/api/v1/public/estimates/")) {
        response.writeHead(404, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: "NOT_FOUND", message: "Estimate not found" }));
        return;
      }

      response.writeHead(404);
      response.end();
    });

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve());
    });

    const address = server.address() as AddressInfo;
    apiBaseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  });

  it("calls the real public estimate GET path over HTTP (no Authorization)", async () => {
    const valid = await isPublicEstimateTokenValid(apiBaseUrl, VALID_TOKEN);

    expect(valid).toBe(true);
  });

  it("returns redirect-approve only when stub API responds 2xx (D3)", async () => {
    const recovery = await resolveLegacyEstimateGetRecovery(`/estimates/${VALID_TOKEN}`, apiBaseUrl);

    expect(recovery).toEqual({ action: "redirect-approve", token: VALID_TOKEN });
  });

  it("returns rewrite-approve when stub API responds 404 for shaped token", async () => {
    const recovery = await resolveLegacyEstimateGetRecovery(`/estimates/${UNKNOWN_TOKEN}`, apiBaseUrl);

    expect(recovery).toEqual({ action: "rewrite-approve", token: UNKNOWN_TOKEN });
  });
});
