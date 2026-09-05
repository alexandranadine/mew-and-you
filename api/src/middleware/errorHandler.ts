import type { NextFunction, Request, Response } from "express";
import { RescueGroupsApiError } from "../integrations/rescuegroups/client";
import { ApiError } from "../lib/errors";
import { logger } from "../lib/logger";

/**
 * Central error handler. Client responses only ever contain a safe `code` +
 * `message` — never stack traces, provider internals, or raw upstream
 * error bodies. Full detail (for debugging) goes to server-side logs only.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ApiError) {
    logger.warn("api_error", {
      path: req.path,
      status: err.status,
      code: err.code,
    });
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
    const level = err.status >= 500 ? "error" : "warn";
    logger[level]("rescuegroups_error", {
      path: req.path,
      status: err.status,
      code,
      message: err.message,
      details: err.details,
    });
    res.status(err.status).json({ error: { code, message: err.message } });
    return;
  }

  logger.error("unhandled_error", {
    path: req.path,
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
  res.status(500).json({
    error: {
      code: "internal_error",
      message: "Something went wrong. Please try again.",
    },
  });
}
