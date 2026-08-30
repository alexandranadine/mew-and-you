import type { NextFunction, Request, Response } from "express";
import { RescueGroupsApiError } from "../integrations/rescuegroups/client";
import { ApiError } from "../lib/errors";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ApiError) {
    res
      .status(err.status)
      .json({ error: { code: err.code, message: err.message } });
    return;
  }

  if (err instanceof RescueGroupsApiError) {
    const code =
      err.status === 429
        ? "rescuegroups_rate_limited"
        : err.status === 404
          ? "not_found"
          : "rescuegroups_error";
    res.status(err.status).json({ error: { code, message: err.message } });
    return;
  }

  console.error("Unhandled error:", err);
  res
    .status(500)
    .json({
      error: {
        code: "internal_error",
        message: "Something went wrong. Please try again.",
      },
    });
}
