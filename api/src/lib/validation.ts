import { ApiError } from "./errors";

const MAX_RADIUS_MILES = 500;
const DEFAULT_RADIUS_MILES = 25;

export function validateZip(raw: unknown): string {
  // Express's query parser turns repeated/bracketed params (e.g. "?zip=1&zip=2")
  // into arrays/objects — reject those explicitly rather than coercing them.
  if (raw !== undefined && typeof raw !== "string") {
    throw new ApiError('"zip" must be a single value.', 400, "invalid_zip");
  }

  const zip = typeof raw === "string" ? raw.trim() : "";
  if (!zip) {
    throw new ApiError(
      'A "zip" query parameter is required.',
      400,
      "missing_zip",
    );
  }
  if (!/^\d{5}$/.test(zip)) {
    throw new ApiError(
      `"${zip}" is not a valid 5-digit ZIP code.`,
      400,
      "invalid_zip",
    );
  }
  return zip;
}

export function validateRadius(raw: unknown): number {
  if (raw === undefined || raw === null || raw === "") {
    return DEFAULT_RADIUS_MILES;
  }
  if (typeof raw !== "string") {
    throw new ApiError(
      '"radius" must be a single value.',
      400,
      "invalid_radius",
    );
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0 || value > MAX_RADIUS_MILES) {
    throw new ApiError(
      `"${String(raw)}" is not a valid search radius (must be between 1 and ${MAX_RADIUS_MILES} miles).`,
      400,
      "invalid_radius",
    );
  }
  return value;
}
