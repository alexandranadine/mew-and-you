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
import { writeFavoriteIds } from "../lib/favoritesStorage";
import { makeCat } from "../test/catFixture";
import { HomePage } from "./HomePage";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  writeFavoriteIds([]);
});

function renderHome() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cats/:catId" element={<div>Detail page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("HomePage live sample listings", () => {
  it("renders sampled cats that link to their detail pages", async () => {
    const cats = [
      makeCat({ id: "rescuegroups:11", name: "Miso" }),
      makeCat({ id: "rescuegroups:22", name: "Beans" }),
      makeCat({ id: "rescuegroups:33", name: "Nori" }),
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ cats }),
      }),
    );

    renderHome();

    expect(await screen.findByRole("heading", { name: "Miso" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Beans" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Nori" })).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /Meet Miso/ })).toHaveAttribute(
      "href",
      "/cats/rescuegroups%3A11",
    );
    expect(screen.getByRole("link", { name: /Meet Beans/ })).toHaveAttribute(
      "href",
      "/cats/rescuegroups%3A22",
    );
    expect(screen.getByRole("link", { name: /Meet Nori/ })).toHaveAttribute(
      "href",
      "/cats/rescuegroups%3A33",
    );

    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalled();
    const requestedUrl = String(fetchMock.mock.calls[0]?.[0]);
    expect(requestedUrl).toContain("/api/cats/sample?");
    expect(requestedUrl).toContain("zip=90012");
    expect(requestedUrl).toContain("radius=50");
    expect(requestedUrl).toContain("count=3");
    expect(requestedUrl).not.toMatch(/\/api\/cats\?/);
  });

  it("keeps Favorites working on sample cards", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          cats: [makeCat({ id: "rescuegroups:11", name: "Miso" })],
        }),
      }),
    );

    renderHome();
    const favorite = await screen.findByRole("button", {
      name: "Add Miso to favorites",
    });

    fireEvent.click(favorite);

    expect(
      screen.getByRole("button", { name: "Remove Miso from favorites" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("hides the sample section quietly when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => ({
          error: { code: "rescuegroups_error", message: "upstream down" },
        }),
      }),
    );

    renderHome();

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "Go ahead, get attached." }),
      ).not.toBeInTheDocument();
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText(/upstream down/i)).not.toBeInTheDocument();
  });

  it("hides the sample section when the API returns no cats", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ cats: [] }),
      }),
    );

    renderHome();

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "Go ahead, get attached." }),
      ).not.toBeInTheDocument();
    });
  });

  it("reserves sample-card space while loading", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(new Promise(() => undefined)),
    );

    const { container } = renderHome();

    expect(
      screen.getByRole("heading", { name: "Go ahead, get attached." }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll(".animate-pulse, [class*='pulse']").length).toBeGreaterThan(0);
  });
});
