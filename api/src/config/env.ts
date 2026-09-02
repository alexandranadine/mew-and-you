import "dotenv/config";

export type NodeEnv = "development" | "production" | "test";

export interface Env {
  nodeEnv: NodeEnv;
  isProduction: boolean;
  port: number;
  dataProvider: "mock" | "rescuegroups";
  rescueGroupsApiKey: string;
  rescueGroupsBaseUrl: string;
  corsOrigins: string[];
  trustProxy: boolean;
  rateLimitWindowMs: number;
  rateLimitMax: number;
}

export interface ParsedEnv {
  env: Env;
  errors: string[];
}

function parsePositiveInt(
  value: string | undefined,
  fallback: number,
  name: string,
  errors: string[],
  max = Number.MAX_SAFE_INTEGER,
): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed > 0 && parsed <= max) return parsed;
  errors.push(
    `${name} must be a positive integer${max === Number.MAX_SAFE_INTEGER ? "" : ` (max ${max})`}, got "${value}".`,
  );
  return fallback;
}

/**
 * Pure parsing/validation over a process-env-like source — no logging, no
 * process.exit, so it's easy to unit test every combination. The module
 * below calls this with the real `process.env` and acts on the result.
 */
export function parseEnv(source: NodeJS.ProcessEnv): ParsedEnv {
  const errors: string[] = [];

  const nodeEnv: NodeEnv =
    source.NODE_ENV === "production" || source.NODE_ENV === "test"
      ? source.NODE_ENV
      : "development";
  const isProduction = nodeEnv === "production";

  const port = parsePositiveInt(source.PORT, 3001, "PORT", errors, 65535);

  const dataProvider: "mock" | "rescuegroups" =
    source.DATA_PROVIDER?.trim().toLowerCase() === "rescuegroups"
      ? "rescuegroups"
      : "mock";

  const rescueGroupsApiKey = source.RESCUEGROUPS_API_KEY?.trim() || "";
  const rescueGroupsBaseUrl =
    source.RESCUEGROUPS_BASE_URL?.trim() || "https://api.rescuegroups.org/v5";
  if (!/^https?:\/\//i.test(rescueGroupsBaseUrl)) {
    errors.push(
      `RESCUEGROUPS_BASE_URL must start with http:// or https://, got "${rescueGroupsBaseUrl}".`,
    );
  }

  if (dataProvider === "rescuegroups" && !rescueGroupsApiKey) {
    errors.push(
      "DATA_PROVIDER=rescuegroups requires RESCUEGROUPS_API_KEY to be set.",
    );
  }

  const configuredCorsOrigins = (source.CORS_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (isProduction && configuredCorsOrigins.length === 0) {
    errors.push(
      "CORS_ORIGIN must be set in production (comma-separated list of allowed origins).",
    );
  }

  const corsOrigins =
    configuredCorsOrigins.length > 0
      ? configuredCorsOrigins
      : ["http://localhost:5173"];

  const trustProxy = source.TRUST_PROXY?.trim().toLowerCase() === "true";

  const rateLimitWindowMs = parsePositiveInt(
    source.RATE_LIMIT_WINDOW_MS,
    15 * 60 * 1000,
    "RATE_LIMIT_WINDOW_MS",
    errors,
  );
  const rateLimitMax = parsePositiveInt(
    source.RATE_LIMIT_MAX,
    100,
    "RATE_LIMIT_MAX",
    errors,
  );

  return {
    env: {
      nodeEnv,
      isProduction,
      port,
      dataProvider,
      rescueGroupsApiKey,
      rescueGroupsBaseUrl,
      corsOrigins,
      trustProxy,
      rateLimitWindowMs,
      rateLimitMax,
    },
    errors,
  };
}

const { env: parsedEnv, errors: startupErrors } = parseEnv(process.env);

if (startupErrors.length > 0) {
  console.error("[config] Invalid environment configuration:");
  for (const message of startupErrors) console.error(`  - ${message}`);
  process.exit(1);
}

if (parsedEnv.dataProvider === "mock") {
  console.log(
    "[config] DATA_PROVIDER=mock — serving cats from local mock data, no RescueGroups API key needed.",
  );
}

export const env = parsedEnv;
