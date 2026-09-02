import rateLimit from "express-rate-limit";
import { env } from "../config/env";

interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
}

/** Rate-limits requests per IP. Defaults come from env (configurable per deployment). */
export function createRateLimiter(options: RateLimiterOptions = {}) {
  return rateLimit({
    windowMs: options.windowMs ?? env.rateLimitWindowMs,
    limit: options.max ?? env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        code: "rate_limited",
        message: "Too many requests. Please slow down and try again shortly.",
      },
    },
  });
}
