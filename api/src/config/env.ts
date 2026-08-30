import "dotenv/config";

function readOrigins(value: string | undefined): string[] {
  if (!value) return ["http://localhost:5173"];
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const env = {
  port: Number(process.env.PORT) || 3001,
  rescueGroupsApiKey: process.env.RESCUEGROUPS_API_KEY?.trim() || "",
  rescueGroupsBaseUrl:
    process.env.RESCUEGROUPS_BASE_URL?.trim() ||
    "https://api.rescuegroups.org/v5",
  corsOrigins: readOrigins(process.env.CORS_ORIGIN),
};

if (!env.rescueGroupsApiKey) {
  // Don't crash the server — allow it to run so /health etc. still work locally,
  // but every /api/cats request will fail fast with a clear error until this is set.
  console.warn(
    "[config] RESCUEGROUPS_API_KEY is not set. Requests to /api/cats will fail until it is configured (see .env.example).",
  );
}
