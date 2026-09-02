import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger";

/** Logs method/path/query/status/duration for every request. Never logs headers, so secrets can't leak here. */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    logger.info("request", {
      method: req.method,
      path: req.path,
      query: req.query,
      status: res.statusCode,
      durationMs: Math.round(durationMs),
    });
  });

  next();
}
