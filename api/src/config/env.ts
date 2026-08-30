import "dotenv/config";

function readOrigins(value: string | undefined): string[] {
  if (!value) return ["http://localhost:5173"];
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function readDataProvider(value: string | undefined): "mock" | "rescuegroups" {
  return value?.trim().toLowerCase() === "rescuegroups"
    ? "rescuegroups"
    : "mock";
}

export const env = {
  port: Number(process.env.PORT) || 3001,
  dataProvider: readDataProvider(process.env.DATA_PROVIDER),
  rescueGroupsApiKey: process.env.RESCUEGROUPS_API_KEY?.trim() || "",
  rescueGroupsBaseUrl:
    process.env.RESCUEGROUPS_BASE_URL?.trim() ||
    "https://api.rescuegroups.org/v5",
  corsOrigins: readOrigins(process.env.CORS_ORIGIN),
};

if (env.dataProvider === "mock") {
  console.log(
    "[config] DATA_PROVIDER=mock — serving cats from local mock data, no RescueGroups API key needed.",
  );
} else if (!env.rescueGroupsApiKey) {
  // Don't crash the server — allow it to run so /health etc. still work locally,
  // but every /api/cats request will fail fast with a clear error until this is set.
  console.warn(
    "[config] DATA_PROVIDER=rescuegroups but RESCUEGROUPS_API_KEY is not set. Requests to /api/cats will fail until it is configured (see .env.example).",
  );
}
