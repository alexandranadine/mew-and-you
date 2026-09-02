import { describe, expect, it, vi } from "vitest";
import { RescueGroupsApiError } from "../integrations/rescuegroups/client";
import { ApiError } from "../lib/errors";
import { errorHandler } from "./errorHandler";

function makeRes() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };
  res.status.mockReturnValue(res);
  return res as unknown as import("express").Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
}

const req = { path: "/api/cats" } as unknown as import("express").Request;
const next = vi.fn();

describe("errorHandler", () => {
  it("maps ApiError to its own status/code/message and nothing else", () => {
    const res = makeRes();
    errorHandler(new ApiError("bad zip", 400, "invalid_zip"), req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: "invalid_zip", message: "bad zip" },
    });
  });

  it("maps RescueGroupsApiError 404/429 to distinct codes without leaking details", () => {
    const res404 = makeRes();
    const errorWithDetails = new RescueGroupsApiError(
      "not found upstream",
      404,
      {
        secret: "should-not-leak",
      },
    );
    errorHandler(errorWithDetails, req, res404, next);
    expect(res404.status).toHaveBeenCalledWith(404);
    const body404 = res404.json.mock.calls[0][0];
    expect(body404.error.code).toBe("not_found");
    expect(JSON.stringify(body404)).not.toContain("should-not-leak");

    const res429 = makeRes();
    errorHandler(new RescueGroupsApiError("slow down", 429), req, res429, next);
    expect(res429.status).toHaveBeenCalledWith(429);
    expect(res429.json).toHaveBeenCalledWith({
      error: { code: "rescuegroups_rate_limited", message: "slow down" },
    });
  });

  it("never leaks a raw/unexpected error's message or stack to the client", () => {
    const res = makeRes();
    const secretError = new Error(
      "connection string: postgres://user:hunter2@db/prod",
    );
    errorHandler(secretError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    const body = res.json.mock.calls[0][0];
    expect(body).toEqual({
      error: {
        code: "internal_error",
        message: "Something went wrong. Please try again.",
      },
    });
    expect(JSON.stringify(body)).not.toContain("hunter2");
  });

  it("never leaks a plain thrown string either", () => {
    const res = makeRes();
    errorHandler("some raw string error", req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: "internal_error",
        message: "Something went wrong. Please try again.",
      },
    });
  });
});
