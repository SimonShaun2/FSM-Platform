import { describe, expect, it, vi } from "vitest";

import { ErrorCode } from "@fsm/types";

import {
  CSV_IMPORT_MAX_FILE_SIZE_BYTES,
  CSV_IMPORT_MAX_REQUEST_BODY_BYTES
} from "./upload-limits.js";
import { rejectOversizedImportBodyByContentLength } from "./upload-guards.js";

describe("rejectOversizedImportBodyByContentLength", () => {
  it("returns 413 when Content-Length exceeds max request body", async () => {
    const request = {
      headers: {
        "content-length": String(CSV_IMPORT_MAX_REQUEST_BODY_BYTES + 1)
      },
      raw: { destroyed: false },
      id: "req_test"
    };
    const send = vi.fn();
    const status = vi.fn(() => ({ send }));
    const reply = { status };

    await rejectOversizedImportBodyByContentLength(request as never, reply as never);

    expect(status).toHaveBeenCalledWith(413);
    expect(send).toHaveBeenCalledWith({
      error: ErrorCode.VALIDATION_ERROR,
      message: "CSV files must be smaller than 10MB",
      requestId: "req_test"
    });
  });

  it("allows Content-Length at the 10MB CSV boundary", async () => {
    const request = {
      headers: {
        "content-length": String(CSV_IMPORT_MAX_FILE_SIZE_BYTES + 204)
      },
      raw: { destroy: vi.fn(), destroyed: false },
      id: "req_ok"
    };
    const send = vi.fn();
    const reply = { status: vi.fn(() => ({ send })) };

    await rejectOversizedImportBodyByContentLength(request as never, reply as never);

    expect(send).not.toHaveBeenCalled();
  });
});
