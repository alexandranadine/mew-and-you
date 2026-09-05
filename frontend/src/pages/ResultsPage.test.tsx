import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResultsPage, revealResetKeyForQuery } from "./ResultsPage";
import { makeCat } from "../test/catFixture";
import type { CatSex } from "../types/cat";
import type { CatWithDistance } from "../types/search";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function catWithDistance(
  overrides: Partial<CatWithDistance> = {},
): CatWithDistance {
  return {
    ...makeCat(overrides),
    distanceMiles: overrides.distanceMiles ?? 1.2,
  };
}

function renderResults(initialEntry: string) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/cats" element={<ResultsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("revealResetKeyForQuery", () => {
  it("changes when multi-select filters change and ignores sort", () => {
    const base = {
      zip: "91350",
      radiusMiles: 25,
      filters: { sex: ["female"] as CatSex[] },
      sort: "distance" as const,
    };
    const withExtraSex = {
      ...base,
      filters: { sex: ["female", "male"] as CatSex[] },
    };
    const withSortOnly = { ...base, sort: "name" as const };

    expect(revealResetKeyForQuery(base)).not.toBe(
      revealResetKeyForQuery(withExtraSex),
    );
    expect(revealResetKeyForQuery(base)).toBe(
      revealResetKeyForQuery(withSortOnly),
    );
  });

  it("changes when radius changes", () => {
    const a = {
      zip: "91350",
      radiusMiles: 25,
      filters: {},
      sort: "distance" as const,
    };
    const b = { ...a, radiusMiles: 50 };
    expect(revealResetKeyForQuery(a)).not.toBe(revealResetKeyForQuery(b));
  });
});

describe("ResultsPage filters and radius", () => {
  it("applies multi-select OR filters without refetching the API", async () => {
    const cats = [
      catWithDistance({
        id: "1",
        name: "Fiona",
        sex: "female",
        ageGroup: "young",
        size: "small",
      }),
      catWithDistance({
        id: "2",
        name: "Max",
        sex: "male",
        ageGroup: "adult",
        size: "medium",
      }),
      catWithDistance({
        id: "3",
        name: "Luna",
        sex: "female",
        ageGroup: "adult",
        size: "large",
      }),
    ];

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ cats, totalCount: 3 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    renderResults("/cats?zip=91350&radius=25");

    await screen.findByRole("heading", { name: /Cats near 91350/i });
    expect(await screen.findByText("Fiona")).toBeInTheDocument();
    expect(screen.getByText("Max")).toBeInTheDocument();
    expect(screen.getByText("Luna")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Female" }));
    fireEvent.click(screen.getByRole("button", { name: "Male" }));

    await waitFor(() => {
      expect(screen.getByText("Fiona")).toBeInTheDocument();
      expect(screen.getByText("Max")).toBeInTheDocument();
      expect(screen.getByText("Luna")).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Adult" }));
    await waitFor(() => {
      expect(screen.queryByText("Fiona")).not.toBeInTheDocument();
      expect(screen.getByText("Max")).toBeInTheDocument();
      expect(screen.getByText("Luna")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Small" }));
    await waitFor(() => {
      expect(screen.queryByText("Max")).not.toBeInTheDocument();
      expect(screen.queryByText("Luna")).not.toBeInTheDocument();
      expect(
        screen.getByText(/No cats matched your search/i),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Reset filters" })[0]);
    await waitFor(() => {
      expect(screen.getByText("Fiona")).toBeInTheDocument();
      expect(screen.getByText("Max")).toBeInTheDocument();
      expect(screen.getByText("Luna")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Female" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "Adult" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "Small" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("updates the radius search param and refetches with the new radius", async () => {
    const near = [
      catWithDistance({ id: "near", name: "Near Cat", distanceMiles: 2 }),
    ];
    const far = [
      catWithDistance({ id: "far", name: "Far Cat", distanceMiles: 40 }),
    ];

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      const radius = new URL(url, "http://localhost").searchParams.get("radius");
      const cats = radius === "50" ? far : near;
      return Promise.resolve({
        ok: true,
        json: async () => ({ cats, totalCount: cats.length }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    renderResults("/cats?zip=91350&radius=25&sex=female");

    expect(await screen.findByText("Near Cat")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("zip=91350&radius=25"),
    );

    const radiusSelect = screen.getByLabelText("Search radius");
    expect(radiusSelect).toHaveValue("25");
    fireEvent.change(radiusSelect, { target: { value: "50" } });

    await waitFor(() => {
      expect(screen.getByText("Far Cat")).toBeInTheDocument();
    });
    expect(screen.queryByText("Near Cat")).not.toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("zip=91350&radius=50"),
    );
    expect(radiusSelect).toHaveValue("50");

    // Client-side sex filter selection is preserved in the URL/control state.
    expect(screen.getByRole("button", { name: "Female" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("resets progressive reveal when filters change", async () => {
    const cats = Array.from({ length: 50 }, (_, index) =>
      catWithDistance({
        id: String(index),
        name: `Cat ${index}`,
        sex: index % 2 === 0 ? "female" : "male",
        ageGroup: "adult",
        size: "medium",
        distanceMiles: index + 1,
      }),
    );

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ cats, totalCount: 50 }),
      }),
    );

    renderResults("/cats?zip=91350&radius=25");

    await screen.findByText("Cat 0");
    expect(screen.getByText("Showing 24 of 50 cats")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show more cats" }));
    expect(screen.getByText("Cat 40")).toBeInTheDocument();
    expect(screen.getByText("Showing 48 of 50 cats")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Female" }));

    await waitFor(() => {
      expect(screen.getByText(/25 potential/i)).toBeInTheDocument();
    });
    // Reveal resets to the first page (24 of 25 females).
    expect(screen.getByText("Showing 24 of 25 cats")).toBeInTheDocument();
    expect(screen.getByText("Cat 0")).toBeInTheDocument();
    expect(screen.queryByText("Cat 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Cat 48")).not.toBeInTheDocument();
  });

  it("keeps sorting available after multi-select filters", async () => {
    const cats = [
      catWithDistance({
        id: "b",
        name: "Biscuit",
        sex: "female",
        distanceMiles: 1,
      }),
      catWithDistance({
        id: "a",
        name: "Aster",
        sex: "female",
        distanceMiles: 2,
      }),
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ cats, totalCount: 2 }),
      }),
    );

    renderResults("/cats?zip=91350&radius=25");
    await screen.findByText("Biscuit");

    fireEvent.click(screen.getByRole("button", { name: "Female" }));
    fireEvent.change(screen.getByLabelText("Sort by"), {
      target: { value: "name" },
    });

    await waitFor(() => {
      const list = screen.getByRole("heading", {
        name: "Search results",
        hidden: true,
      }).parentElement;
      expect(list).toBeTruthy();
      const names = within(list as HTMLElement)
        .getAllByRole("heading", { level: 3 })
        .map((el) => el.textContent);
      expect(names[0]).toBe("Aster");
      expect(names[1]).toBe("Biscuit");
    });
  });
});
