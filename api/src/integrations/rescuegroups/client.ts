import { env } from "../../config/env";
import type {
  RgAnimalResource,
  RgSearchResponse,
  RgSingleAnimalData,
  RgSingleAnimalResponse,
} from "./types";

const REQUEST_TIMEOUT_MS = 10_000;

export class RescueGroupsApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "RescueGroupsApiError";
    this.status = status;
    this.details = details;
  }
}

interface SearchAvailableCatsParams {
  postalcode: string;
  miles: number;
  limit?: number;
}

function assertApiKeyConfigured(): string {
  if (!env.rescueGroupsApiKey) {
    throw new RescueGroupsApiError(
      "RescueGroups API key is not configured on the server. Set RESCUEGROUPS_API_KEY (see .env.example).",
      500,
    );
  }
  return env.rescueGroupsApiKey;
}

/** Pull a short, non-sensitive title/detail from a JSON:API error body when present. */
function formatUpstreamErrorMessage(status: number, body: unknown): string {
  const base = `RescueGroups API returned an error (${status}).`;
  if (!body || typeof body !== "object") return base;
  const errors = (body as { errors?: unknown }).errors;
  if (!Array.isArray(errors) || errors.length === 0) return base;
  const first = errors[0];
  if (!first || typeof first !== "object") return base;
  const title = (first as { title?: unknown }).title;
  const detail = (first as { detail?: unknown }).detail;
  const parts = [title, detail].filter(
    (value): value is string => typeof value === "string" && value.trim() !== "",
  );
  return parts.length > 0 ? `${base} ${parts.join(" — ")}` : base;
}

async function rescueGroupsFetch<T>(
  path: string,
  init: RequestInit,
): Promise<T> {
  const apiKey = assertApiKeyConfigured();
  const url = `${env.rescueGroupsBaseUrl}${path}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: apiKey,
        ...init.headers,
      },
      signal: controller.signal,
    });
  } catch (error) {
    throw new RescueGroupsApiError(
      "Unable to reach RescueGroups right now. Please try again shortly.",
      502,
      error instanceof Error ? error.message : error,
    );
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 429) {
    throw new RescueGroupsApiError(
      "RescueGroups rate limit exceeded. Please try again shortly.",
      429,
    );
  }
  if (response.status === 404) {
    throw new RescueGroupsApiError("The requested cat was not found.", 404);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => undefined);
    throw new RescueGroupsApiError(
      formatUpstreamErrorMessage(response.status, body),
      502,
      body,
    );
  }

  // RescueGroups returns HTTP 200 with an empty body for some auth failures
  // (e.g. an invalid API key). Treat that as an upstream error instead of
  // letting response.json() throw a SyntaxError into the generic 500 path.
  const rawBody = await response.text();
  if (!rawBody.trim()) {
    throw new RescueGroupsApiError(
      "RescueGroups returned an empty response. Check that RESCUEGROUPS_API_KEY is valid.",
      502,
    );
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch (error) {
    throw new RescueGroupsApiError(
      "RescueGroups returned an unexpected response.",
      502,
      error instanceof Error ? error.message : error,
    );
  }
}

/**
 * Searches available cats within a radius of a US ZIP code.
 * Distance sorting is done by RescueGroupsProvider — upstream `sort=distance`
 * (and `animals.distance`) has been observed to 400 on the live API even
 * though docs mention it, so we omit it here.
 */
export async function searchAvailableCats({
  postalcode,
  miles,
  limit = 100,
}: SearchAvailableCatsParams): Promise<RgSearchResponse> {
  // Build the query manually so commas in `include` stay literal (matches
  // RescueGroups' own examples and avoids over-encoding).
  const query = [
    "include=breeds,orgs,pictures,locations",
    `limit=${encodeURIComponent(String(limit))}`,
  ].join("&");

  return rescueGroupsFetch<RgSearchResponse>(
    `/public/animals/search/available/cats/?${query}`,
    {
      method: "POST",
      body: JSON.stringify({
        data: {
          filterRadius: {
            miles: Math.round(miles),
            postalcode,
          },
        },
      }),
    },
  );
}

/**
 * Live GET /public/animals/{id} puts the animal in `data: [animal]`.
 * Search already returns an array; this unwraps the single-resource case.
 */
export function unwrapSingleAnimal(
  data: RgSingleAnimalData,
): RgAnimalResource | undefined {
  if (Array.isArray(data)) return data[0];
  return data ?? undefined;
}

/**
 * Attribute sparse-fieldset for GET /public/animals/{id}.
 *
 * Docs say omitting `fields[]` returns either "default fields" or "all
 * attributes" (changelog). The animal Webpage (`url`) is easy to miss if a
 * default fieldset is in effect, so we request it explicitly along with every
 * attribute the mapper reads. Do not drop `url` from this list.
 */
const ANIMAL_DETAIL_FIELDS = [
  "name",
  "ageGroup",
  "ageString",
  "breedPrimary",
  "isBreedMixed",
  "breedString",
  "sex",
  "sizeGroup",
  "descriptionText",
  "descriptionHtml",
  "pictureThumbnailUrl",
  "url",
  "slug",
  "isDogsOk",
  "isCatsOk",
  "isKidsOk",
  "isHousetrained",
].join(",");

/** Org fields the mapper needs for location + adoption CTA fallbacks. */
const ORG_DETAIL_FIELDS = [
  "name",
  "city",
  "state",
  "postalcode",
  "phone",
  "email",
  "url",
  "adoptionUrl",
  "lat",
  "lon",
].join(",");

/** Fetches a single animal by its RescueGroups id (without the "rescuegroups:" prefix). */
export async function getAnimalById(
  animalId: string,
): Promise<RgSingleAnimalResponse> {
  // Keep commas / brackets literal, matching search and RescueGroups' examples.
  const query = [
    "include=breeds,orgs,pictures,locations",
    `fields[animals]=${ANIMAL_DETAIL_FIELDS}`,
    `fields[orgs]=${ORG_DETAIL_FIELDS}`,
  ].join("&");
  const response = await rescueGroupsFetch<RgSingleAnimalResponse>(
    `/public/animals/${encodeURIComponent(animalId)}?${query}`,
    { method: "GET" },
  );
  return {
    ...response,
    data: unwrapSingleAnimal(response.data) ?? null,
  };
}
