import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CatDetailPage } from "./CatDetailPage";
import { ResultsPage } from "./ResultsPage";
import { writeFavoriteIds } from "../lib/favoritesStorage";
import { makeCat } from "../test/catFixture";
import type { CatWithDistance } from "../types/search";
import type { ResultsBrowsingState } from "../lib/resultsBrowsing";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  writeFavoriteIds([]);
});

function catWithDistance(
  overrides: Partial<CatWithDistance> = {},
): CatWithDistance {
  return {
    ...makeCat(overrides),
    distanceMiles: overrides.distanceMiles ?? 1.2,
  };
}

function renderApp(initialEntries: string[] | { pathname: string; search?: string; state?: unknown }[]) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/cats" element={<ResultsPage />} />
          <Route path="/cats/:catId" element={<CatDetailPage />} />
          <Route path="/" element={<div>Home search</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function stubSearchAndDetail(cats: CatWithDistance[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation((url: string) => {
      if (String(url).includes("/api/cats?") && !String(url).match(/\/api\/cats\/[^?]/)) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ cats, totalCount: cats.length }),
        });
      }
      const idMatch = String(url).match(/\/api\/cats\/([^?]+)/);
      const cat = cats.find((c) => c.id === idMatch?.[1]) ?? cats[0];
      return Promise.resolve({
        ok: true,
        json: async () => ({ cat }),
      });
    }),
  );
}

describe("Results ↔ Detail browsing continuity", () => {
  it("forwards full search params on cat links and Back to results", async () => {
    const cats = [
      catWithDistance({
        id: "1",
        name: "Fiona",
        sex: "female",
        ageGroup: "adult",
        size: "small",
      }),
      catWithDistance({ id: "2", name: "Max", sex: "male" }),
    ];
    stubSearchAndDetail(cats);

    const search =
      "zip=91350&radius=50&sex=female&ageGroup=adult&size=small&org=rescuegroups%3Aorg-1&sort=name";
    renderApp([`/cats?${search}`]);

    await screen.findByText("Fiona");
    const cardLink = screen.getByRole("link", { name: /Meet Fiona/i });
    expect(cardLink.getAttribute("href")).toContain("/cats/1?");
    expect(cardLink.getAttribute("href")).toContain("zip=91350");
    expect(cardLink.getAttribute("href")).toContain("radius=50");
    expect(cardLink.getAttribute("href")).toContain("sex=female");
    expect(cardLink.getAttribute("href")).toContain("ageGroup=adult");
    expect(cardLink.getAttribute("href")).toContain("size=small");
    expect(cardLink.getAttribute("href")).toContain("org=rescuegroups");
    expect(cardLink.getAttribute("href")).toContain("sort=name");

    fireEvent.click(cardLink);
    const back = await screen.findByRole("link", { name: /Back to results/i });
    expect(back.getAttribute("href")).toContain("/cats?");
    expect(back.getAttribute("href")).toContain("zip=91350");
    expect(back.getAttribute("href")).toContain("radius=50");
    expect(back.getAttribute("href")).toContain("sex=female");
    expect(back.getAttribute("href")).toContain("sort=name");
  });

  it("preserves a changed radius through Results → Detail → Results", async () => {
    const cats = [catWithDistance({ id: "1", name: "Fiona" })];
    stubSearchAndDetail(cats);

    renderApp(["/cats?zip=91350&radius=50"]);
    await screen.findByText("Fiona");

    fireEvent.click(screen.getByRole("link", { name: /Meet Fiona/i }));
    const back = await screen.findByRole("link", { name: /Back to results/i });
    expect(back).toHaveAttribute("href", "/cats?zip=91350&radius=50");

    fireEvent.click(back);
    await screen.findByRole("heading", { name: /Cats near 91350/i });
    expect(screen.getByLabelText("Search radius")).toHaveValue("50");
  });

  it("preserves multi-select filter params on the round trip", async () => {
    const cats = [
      catWithDistance({
        id: "1",
        name: "Fiona",
        sex: "female",
        ageGroup: "adult",
        size: "small",
      }),
    ];
    stubSearchAndDetail(cats);

    const search = "zip=91350&radius=25&sex=female,male&ageGroup=adult,senior";
    renderApp([`/cats?${search}`]);
    await screen.findByText("Fiona");

    fireEvent.click(screen.getByRole("link", { name: /Meet Fiona/i }));
    const back = await screen.findByRole("link", { name: /Back to results/i });
    expect(back.getAttribute("href")).toContain("/cats?");
    expect(back.getAttribute("href")).toContain("sex=female");
    expect(back.getAttribute("href")).toContain("male");
    expect(back.getAttribute("href")).toContain("ageGroup=adult");
    expect(back.getAttribute("href")).toContain("senior");

    fireEvent.click(back);
    await screen.findByText("Fiona");
    expect(screen.getByRole("button", { name: "Female" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Male" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Adult" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Senior" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("restores progressive reveal count after Back to results", async () => {
    const cats = Array.from({ length: 50 }, (_, index) =>
      catWithDistance({
        id: String(index),
        name: `Cat ${index}`,
        distanceMiles: index + 1,
      }),
    );
    stubSearchAndDetail(cats);

    const search = "zip=91350&radius=25";
    renderApp([`/cats?${search}`]);

    await screen.findByText("Cat 0");
    fireEvent.click(screen.getByRole("button", { name: "Show more cats" }));
    expect(screen.getByText("Showing 48 of 50 cats")).toBeInTheDocument();
    expect(screen.getByText("Cat 40")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: /Meet Cat 0/i }));
    const back = await screen.findByRole("link", { name: /Back to results/i });
    fireEvent.click(back);

    await screen.findByText("Cat 0");
    await waitFor(() => {
      expect(screen.getByText("Showing 48 of 50 cats")).toBeInTheDocument();
    });
    expect(screen.getByText("Cat 40")).toBeInTheDocument();
  });

  it("clamps oversized restored reveal to the current matched set", async () => {
    const cats = Array.from({ length: 30 }, (_, index) =>
      catWithDistance({
        id: String(index),
        name: `Cat ${index}`,
        sex: index < 10 ? "female" : "male",
        distanceMiles: index + 1,
      }),
    );
    stubSearchAndDetail(cats);

    const search = "zip=91350&radius=25&sex=female";
    const resultsBrowsing: ResultsBrowsingState = {
      searchKey: search,
      visibleCount: 72,
      scrollY: 0,
    };

    renderApp([
      {
        pathname: "/cats",
        search: `?${search}`,
        state: { resultsBrowsing },
      },
    ]);

    await screen.findByText("Cat 0");
    await waitFor(() => {
      expect(screen.getByText("Cat 8")).toBeInTheDocument();
    });
    // 10 females total — restored 72 must not invent a "show more" affordance.
    expect(screen.queryByRole("button", { name: "Show more cats" })).toBeNull();
    expect(screen.queryByText("Cat 10")).not.toBeInTheDocument();
  });

  it("restores scroll only for the matching results search context", async () => {
    const cats = [catWithDistance({ id: "1", name: "Fiona" })];
    stubSearchAndDetail(cats);
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

    const matchingSearch = "zip=91350&radius=25";
    renderApp([
      {
        pathname: "/cats",
        search: `?${matchingSearch}`,
        state: {
          resultsBrowsing: {
            searchKey: matchingSearch,
            visibleCount: 24,
            scrollY: 640,
          },
        },
      },
    ]);

    await screen.findByText("Fiona");
    await waitFor(() => {
      expect(scrollTo).toHaveBeenCalledWith({
        top: 640,
        left: 0,
        behavior: "auto",
      });
    });
  });

  it("does not restore scroll when browsing state is for a different search", async () => {
    const cats = [catWithDistance({ id: "1", name: "Fiona" })];
    stubSearchAndDetail(cats);
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

    renderApp([
      {
        pathname: "/cats",
        search: "?zip=91350&radius=25",
        state: {
          resultsBrowsing: {
            searchKey: "zip=90001&radius=50",
            visibleCount: 48,
            scrollY: 900,
          },
        },
      },
    ]);

    await screen.findByText("Fiona");
    // Allow layout effects to flush.
    await waitFor(() => {
      expect(screen.getByLabelText("Search radius")).toHaveValue("25");
    });
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("starts a fresh results visit at the default reveal without prior state", async () => {
    const cats = Array.from({ length: 50 }, (_, index) =>
      catWithDistance({
        id: String(index),
        name: `Cat ${index}`,
        distanceMiles: index + 1,
      }),
    );
    stubSearchAndDetail(cats);
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

    renderApp(["/cats?zip=91350&radius=25"]);
    await screen.findByText("Cat 0");
    expect(screen.getByText("Showing 24 of 50 cats")).toBeInTheDocument();
    expect(screen.queryByText("Cat 40")).not.toBeInTheDocument();
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("falls back safely when a detail page has no results context", async () => {
    const cat = makeCat({ id: "solo", name: "Solo" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ cat }),
      }),
    );

    renderApp(["/cats/solo"]);
    const back = await screen.findByRole("link", { name: /Back to search/i });
    expect(back).toHaveAttribute("href", "/");

    fireEvent.click(back);
    expect(await screen.findByText("Home search")).toBeInTheDocument();
  });

  it("keeps favorites controls intact on detail after arriving from results", async () => {
    const cats = [catWithDistance({ id: "1", name: "Fiona" })];
    stubSearchAndDetail(cats);

    renderApp(["/cats?zip=91350&radius=25"]);
    await screen.findByText("Fiona");
    fireEvent.click(screen.getByRole("link", { name: /Meet Fiona/i }));

    const favorite = await screen.findByRole("button", {
      name: /Add Fiona to favorites/i,
    });
    expect(favorite).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(favorite);
    expect(favorite).toHaveAttribute("aria-pressed", "true");
  });
});
