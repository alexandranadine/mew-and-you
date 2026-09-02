import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app";
import { createRateLimiter } from "./middleware/rateLimiter";

const app = createApp();

describe("GET /health and /api/health", () => {
  it("both respond 200 with an ok status", async () => {
    const health = await request(app).get("/health");
    expect(health.status).toBe(200);
    expect(health.body.status).toBe("ok");

    const apiHealth = await request(app).get("/api/health");
    expect(apiHealth.status).toBe(200);
    expect(apiHealth.body.status).toBe("ok");
  });
});

describe("unknown routes", () => {
  it("return a consistent 404 JSON error shape", async () => {
    const res = await request(app).get("/nope");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("not_found");
  });
});

describe("GET /api/cats validation", () => {
  it("rejects a missing zip with 400", async () => {
    const res = await request(app).get("/api/cats");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("missing_zip");
  });

  it("rejects an invalid zip with 400", async () => {
    const res = await request(app).get("/api/cats?zip=abc");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_zip");
  });

  it("rejects an out-of-range radius with 400", async () => {
    const res = await request(app).get("/api/cats?zip=90026&radius=9999");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_radius");
  });
});

describe("security headers", () => {
  it("sets helmet security headers", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["cross-origin-resource-policy"]).toBe("cross-origin");
  });
});

describe("CORS", () => {
  it("reflects an allowed origin", async () => {
    const res = await request(app)
      .get("/health")
      .set("Origin", "http://localhost:5173");
    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5173",
    );
  });

  it("does not reflect a disallowed origin", async () => {
    const res = await request(app)
      .get("/health")
      .set("Origin", "http://evil.example.com");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("rate limiting", () => {
  it("returns 429 once the limit is exceeded", async () => {
    const miniApp = express();
    miniApp.use(createRateLimiter({ windowMs: 60_000, max: 2 }));
    miniApp.get("/", (_req, res) => res.json({ ok: true }));

    const agent = request(miniApp);
    expect((await agent.get("/")).status).toBe(200);
    expect((await agent.get("/")).status).toBe(200);
    const third = await agent.get("/");
    expect(third.status).toBe(429);
    expect(third.body.error.code).toBe("rate_limited");
  });

  it("does not apply the rate limiter to the health endpoint", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    // The rate limiter (when applied) adds RateLimit-* headers; their absence
    // confirms /api/health is mounted outside of it.
    expect(res.headers["ratelimit-limit"]).toBeUndefined();
  });
});
