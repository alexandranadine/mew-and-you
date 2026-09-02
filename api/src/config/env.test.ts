import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

const BASE_ENV: NodeJS.ProcessEnv = {};

describe("parseEnv", () => {
  it("returns safe defaults for an empty environment", () => {
    const { env, errors } = parseEnv(BASE_ENV);

    expect(errors).toEqual([]);
    expect(env.nodeEnv).toBe("development");
    expect(env.isProduction).toBe(false);
    expect(env.port).toBe(3001);
    expect(env.dataProvider).toBe("mock");
    expect(env.corsOrigins).toEqual(["http://localhost:5173"]);
    expect(env.trustProxy).toBe(false);
    expect(env.rateLimitWindowMs).toBe(15 * 60 * 1000);
    expect(env.rateLimitMax).toBe(100);
  });

  it("requires RESCUEGROUPS_API_KEY when DATA_PROVIDER=rescuegroups", () => {
    const { errors } = parseEnv({ DATA_PROVIDER: "rescuegroups" });
    expect(errors).toContain(
      "DATA_PROVIDER=rescuegroups requires RESCUEGROUPS_API_KEY to be set.",
    );
  });

  it("is satisfied once an API key is provided for DATA_PROVIDER=rescuegroups", () => {
    const { env, errors } = parseEnv({
      DATA_PROVIDER: "rescuegroups",
      RESCUEGROUPS_API_KEY: "test-key",
    });
    expect(errors).toEqual([]);
    expect(env.dataProvider).toBe("rescuegroups");
  });

  it("requires CORS_ORIGIN to be set in production", () => {
    const { errors } = parseEnv({ NODE_ENV: "production" });
    expect(errors).toContain(
      "CORS_ORIGIN must be set in production (comma-separated list of allowed origins).",
    );
  });

  it("accepts a valid CORS_ORIGIN in production and parses a comma-separated list", () => {
    const { env, errors } = parseEnv({
      NODE_ENV: "production",
      CORS_ORIGIN: "https://mewandyou.example, https://www.mewandyou.example",
    });
    expect(errors).toEqual([]);
    expect(env.corsOrigins).toEqual([
      "https://mewandyou.example",
      "https://www.mewandyou.example",
    ]);
  });

  it("rejects an invalid PORT", () => {
    expect(parseEnv({ PORT: "not-a-number" }).errors.length).toBeGreaterThan(0);
    expect(parseEnv({ PORT: "0" }).errors.length).toBeGreaterThan(0);
    expect(parseEnv({ PORT: "-1" }).errors.length).toBeGreaterThan(0);
    expect(parseEnv({ PORT: "99999" }).errors.length).toBeGreaterThan(0);
  });

  it("accepts a valid PORT", () => {
    const { env, errors } = parseEnv({ PORT: "4000" });
    expect(errors).toEqual([]);
    expect(env.port).toBe(4000);
  });

  it("rejects a RESCUEGROUPS_BASE_URL without a protocol", () => {
    const { errors } = parseEnv({
      RESCUEGROUPS_BASE_URL: "api.rescuegroups.org/v5",
    });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("parses TRUST_PROXY as a strict boolean flag", () => {
    expect(parseEnv({ TRUST_PROXY: "true" }).env.trustProxy).toBe(true);
    expect(parseEnv({ TRUST_PROXY: "false" }).env.trustProxy).toBe(false);
    expect(parseEnv({ TRUST_PROXY: "1" }).env.trustProxy).toBe(false);
    expect(parseEnv({}).env.trustProxy).toBe(false);
  });

  it("rejects an invalid RATE_LIMIT_MAX / RATE_LIMIT_WINDOW_MS", () => {
    expect(parseEnv({ RATE_LIMIT_MAX: "0" }).errors.length).toBeGreaterThan(0);
    expect(
      parseEnv({ RATE_LIMIT_WINDOW_MS: "-5" }).errors.length,
    ).toBeGreaterThan(0);
  });
});
