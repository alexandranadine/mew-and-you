import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../config/env", () => ({
  env: {
    rescueGroupsApiKey: "test-key",
    rescueGroupsBaseUrl: "https://api.rescuegroups.org/v5",
  },
}));

import {
  getAnimalById,
  RescueGroupsApiError,
  searchAvailableCats,
} from "./client";

function mockFetchResponse(init: {
  status?: number;
  body?: string;
  json?: unknown;
}): void {
  const status = init.status ?? 200;
  const body =
    init.body !== undefined
      ? init.body
      : init.json !== undefined
        ? JSON.stringify(init.json)
        : "";

  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      text: async () => body,
      json: async () => {
        if (!body) throw new SyntaxError("Unexpected end of JSON input");
        return JSON.parse(body);
      },
    }),
  );
}

describe("RescueGroups client", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("searches with filterRadius, distance sort, and Authorization header", async () => {
    mockFetchResponse({
      json: { data: [], meta: { count: 0 } },
    });

    await searchAvailableCats({ postalcode: "90210", miles: 25, limit: 100 });

    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain(
      "/public/animals/search/available/cats/?include=breeds%2Corgs%2Cpictures%2Clocations&sort=distance&limit=100",
    );
    expect(init).toMatchObject({
      method: "POST",
      headers: expect.objectContaining({
        Authorization: "test-key",
        "Content-Type": "application/vnd.api+json",
      }),
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      data: { filterRadius: { miles: 25, postalcode: "90210" } },
    });
  });

  it("maps RescueGroups' empty 200 (invalid key) to a clear 502", async () => {
    mockFetchResponse({ status: 200, body: "" });

    await expect(getAnimalById("123")).rejects.toMatchObject({
      name: "RescueGroupsApiError",
      status: 502,
      message: expect.stringContaining("RESCUEGROUPS_API_KEY"),
    } satisfies Partial<RescueGroupsApiError>);
  });

  it("maps non-JSON 200 bodies to a 502", async () => {
    mockFetchResponse({ status: 200, body: "not-json" });

    await expect(searchAvailableCats({ postalcode: "90210", miles: 10 })).rejects
      .toMatchObject({
        name: "RescueGroupsApiError",
        status: 502,
        message: "RescueGroups returned an unexpected response.",
      });
  });

  it("maps HTTP 401 to a 502 without leaking the upstream body to the message", async () => {
    mockFetchResponse({
      status: 401,
      json: {
        errors: [{ detail: "secret upstream detail" }],
      },
    });

    await expect(getAnimalById("123")).rejects.toMatchObject({
      status: 502,
      message: "RescueGroups API returned an error (401).",
    });
  });
});
