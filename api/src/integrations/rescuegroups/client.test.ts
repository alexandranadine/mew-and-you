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

  it("searches with filterRadius and Authorization header, without upstream sort", async () => {
    mockFetchResponse({
      json: { data: [], meta: { count: 0 } },
    });

    await searchAvailableCats({ postalcode: "90210", miles: 25.4, limit: 100 });

    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toBe(
      "https://api.rescuegroups.org/v5/public/animals/search/available/cats/?include=breeds,orgs,pictures,locations&limit=100",
    );
    expect(String(url)).not.toContain("sort=");
    expect(init).toMatchObject({
      method: "POST",
      headers: expect.objectContaining({
        Authorization: "test-key",
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
      }),
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      data: { filterRadius: { miles: 25, postalcode: "90210" } },
    });
  });

  it("includes page query parameter when page > 1", async () => {
    mockFetchResponse({
      json: { data: [], meta: { count: 0 } },
    });

    await searchAvailableCats({
      postalcode: "90210",
      miles: 25,
      limit: 100,
      page: 2,
    });

    expect(fetch).toHaveBeenCalledOnce();
    const [url] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toBe(
      "https://api.rescuegroups.org/v5/public/animals/search/available/cats/?include=breeds,orgs,pictures,locations&limit=100&page=2",
    );
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

  it("GETs /public/animals/{id} with include commas and explicit animal url field", async () => {
    mockFetchResponse({
      json: {
        data: { type: "animals", id: "123", attributes: { name: "Mochi" } },
      },
    });

    await getAnimalById("123");

    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    const requested = String(url);
    expect(requested).toContain(
      "https://api.rescuegroups.org/v5/public/animals/123?",
    );
    expect(requested).toContain("include=breeds,orgs,pictures,locations");
    // Webpage (`url`) must be requested so a default fieldset cannot omit it.
    expect(requested).toMatch(/fields\[animals]=[^&]*\burl\b/);
    expect(requested).toMatch(/fields\[orgs]=[^&]*\badoptionUrl\b/);
    expect(requested).toMatch(/fields\[orgs]=[^&]*\burl\b/);
    expect(init).toMatchObject({ method: "GET" });
  });

  it("unwraps the live GET /public/animals/{id} data array into a single animal", async () => {
    mockFetchResponse({
      json: {
        data: [
          {
            type: "animals",
            id: "18134969",
            attributes: { name: "Willy" },
          },
        ],
        included: [{ type: "orgs", id: "5586", attributes: { name: "Rescue" } }],
      },
    });

    const response = await getAnimalById("18134969");

    expect(response.data).toEqual({
      type: "animals",
      id: "18134969",
      attributes: { name: "Willy" },
    });
    expect(response.included).toHaveLength(1);
  });

  it("includes RescueGroups error title/detail in the message for non-OK responses", async () => {
    mockFetchResponse({
      status: 400,
      json: {
        errors: [
          {
            status: 400,
            title: "Invalid parameter",
            detail: "sort value is not valid",
          },
        ],
      },
    });

    await expect(getAnimalById("123")).rejects.toMatchObject({
      status: 502,
      message:
        "RescueGroups API returned an error (400). Invalid parameter — sort value is not valid",
    });
  });
});
