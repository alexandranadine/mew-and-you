import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { createRateLimiter } from "./middleware/rateLimiter";
import { requestLogger } from "./middleware/requestLogger";
import { catsRouter } from "./routes/cats";
import { healthRouter } from "./routes/health";

/** Builds the Express app without starting a listener, so it can be reused in tests. */
export function createApp() {
  const app = express();

  // Required when deployed behind a trusted reverse proxy/load balancer, so
  // rate limiting sees the real client IP via X-Forwarded-For. Never enable
  // this unless there's actually a trusted proxy in front of the server.
  if (env.trustProxy) {
    app.set("trust proxy", 1);
  }

  app.use(
    helmet({
      // This is a cross-origin API by design (frontend runs on a different
      // origin/port); access control is handled by CORS below, not CORP.
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(
    cors({
      origin: env.corsOrigins,
      methods: ["GET"],
    }),
  );
  app.use(express.json({ limit: "10kb" }));
  app.use(requestLogger);

  app.use("/health", healthRouter);
  app.use("/api/health", healthRouter);
  app.use("/api/cats", createRateLimiter(), catsRouter);

  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: "not_found",
        message: `No route for ${req.method} ${req.path}`,
      },
    });
  });

  app.use(errorHandler);

  return app;
}
