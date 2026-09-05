import { env } from "../../config/env";
import type { RgSearchResponse, RgSingleAnimalResponse } from "./types";

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
      `RescueGroups API returned an error (${response.status}).`,
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

/** Searches available cats within a radius of a US ZIP code, sorted closest-first. */
export async function searchAvailableCats({
  postalcode,
  miles,
  limit = 100,
}: SearchAvailableCatsParams): Promise<RgSearchResponse> {
  const params = new URLSearchParams({
    include: "breeds,orgs,pictures,locations",
    // Official docs use `sort=distance` on radius searches (distance is a
    // meta attribute added when filterRadius is present).
    sort: "distance",
    limit: String(limit),
  });

  return rescueGroupsFetch<RgSearchResponse>(
    `/public/animals/search/available/cats/?${params.toString()}`,
    {
      method: "POST",
      body: JSON.stringify({
        data: {
          filterRadius: { miles, postalcode },
        },
      }),
    },
  );
}

/** Fetches a single animal by its RescueGroups id (without the "rescuegroups:" prefix). */
export async function getAnimalById(
  animalId: string,
): Promise<RgSingleAnimalResponse> {
  const params = new URLSearchParams({
    include: "breeds,orgs,pictures,locations",
  });
  return rescueGroupsFetch<RgSingleAnimalResponse>(
    `/public/animals/${animalId}?${params.toString()}`,
    { method: "GET" },
  );
}
