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
import { CatDetailPage } from "./CatDetailPage";
import { writeFavoriteIds } from "../lib/favoritesStorage";
import { makeCat } from "../test/catFixture";
import type { Cat } from "../types/cat";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  writeFavoriteIds([]);
});

function renderDetail(
  cat: Cat,
  options: {
    zip?: string;
    distanceMiles?: number;
  } = {},
) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ cat }),
    }),
  );

  const search = options.zip ? `?zip=${encodeURIComponent(options.zip)}` : "";
  const entry = {
    pathname: `/cats/${cat.id}`,
    search,
    state:
      typeof options.distanceMiles === "number"
        ? { distanceMiles: options.distanceMiles }
        : undefined,
  };

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/cats/:catId" element={<CatDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function loadedHeading(name: string): Promise<HTMLElement> {
  return screen.findByRole("heading", { level: 1, name });
}

function attributeTiles(container: HTMLElement) {
  return container.querySelectorAll("dl > div");
}

describe("CatDetailPage identity and stats", () => {
  it("keeps the name heading, breed beneath it, and distance in identity metadata", async () => {
    renderDetail(makeCat(), { distanceMiles: 3.2 });

    const heading = await loadedHeading("Miso");
    const identity = heading.parentElement;
    expect(identity).toBeTruthy();
    expect(identity).toHaveTextContent("Domestic Short Hair");
    expect(identity).toHaveTextContent("3.2 mi away");
    expect(screen.queryByText("Shelter ID")).not.toBeInTheDocument();

    const favorite = screen.getByRole("button", {
      name: /Add Miso to favorites/i,
    });
    expect(identity?.contains(favorite)).toBe(false);
    expect(favorite).toHaveAttribute("aria-pressed", "false");
  });

  it("shows exact age with age group as subtle secondary text", async () => {
    const { container } = renderDetail(
      makeCat({ age: "6 Years 1 Month", ageGroup: "adult" }),
    );
    await loadedHeading("Miso");

    const ageTile = [...attributeTiles(container)].find((tile) =>
      tile.textContent?.includes("6 Years 1 Month"),
    );
    expect(ageTile).toBeTruthy();
    expect(ageTile?.textContent).toContain("Adult");
    expect(screen.getAllByText("Adult")).toHaveLength(1);
  });

  it("does not render duplicate Adult / Adult when only the age group is known", async () => {
    const { container } = renderDetail(
      makeCat({ age: "Adult", ageGroup: "adult" }),
    );
    await loadedHeading("Miso");

    expect(screen.getAllByText("Adult")).toHaveLength(1);
    const ageTile = [...attributeTiles(container)].find((tile) =>
      within(tile as HTMLElement).queryByText("Age"),
    );
    expect(ageTile?.textContent).toMatch(/^Age\s*Adult$/);
  });

  it("collapses missing sex and size without empty placeholders", async () => {
    const { container } = renderDetail(
      makeCat({ sex: "unknown", size: "unknown" }),
    );
    await loadedHeading("Miso");

    expect(screen.getByText("Age")).toBeInTheDocument();
    expect(screen.queryByText("Sex")).not.toBeInTheDocument();
    expect(screen.queryByText("Size")).not.toBeInTheDocument();
    expect(attributeTiles(container)).toHaveLength(1);
    expect(container.querySelector("dl")?.className).toContain("flex");
    expect(container.querySelector("dl")?.className).not.toContain("grid-cols-");
  });

  it("uses content-sized tiles for two attributes and a three-column grid for three", async () => {
    const two = renderDetail(makeCat({ size: "unknown" }));
    await loadedHeading("Miso");
    expect(attributeTiles(two.container)).toHaveLength(2);
    expect(two.container.querySelector("dl")?.className).toContain("flex");
    expect(two.container.querySelector("dl")?.className).not.toContain(
      "grid-cols-2",
    );
    two.unmount();

    const three = renderDetail(makeCat());
    await loadedHeading("Miso");
    expect(attributeTiles(three.container)).toHaveLength(3);
    expect(three.container.querySelector("dl")?.className).toContain(
      "grid-cols-3",
    );
  });

  it("does not reserve attribute tiles when age, sex, and size are unknown", async () => {
    const { container } = renderDetail(
      makeCat({
        age: "Age unknown",
        ageGroup: "unknown",
        sex: "unknown",
        size: "unknown",
      }),
    );
    await loadedHeading("Miso");

    expect(container.querySelector("dl")).toBeNull();
    expect(screen.queryByText("Age")).not.toBeInTheDocument();
    expect(screen.queryByText("Sex")).not.toBeInTheDocument();
    expect(screen.queryByText("Size")).not.toBeInTheDocument();
  });
});

describe("CatDetailPage kennel ID label", () => {
  it("shows a subtle Shelter ID indicator for an obvious kennel ID without renaming the cat", async () => {
    renderDetail(makeCat({ name: "A2291008" }));

    expect(await loadedHeading("A2291008")).toBeInTheDocument();
    expect(screen.getByText("Shelter ID")).toBeInTheDocument();
    await waitFor(() => {
      const jsonLd = document.getElementById("page-json-ld");
      expect(jsonLd?.textContent).toContain('"name":"A2291008"');
    });
  });

  it("does not label ordinary cat names as shelter IDs", async () => {
    renderDetail(makeCat({ name: "KitKat" }));
    await loadedHeading("KitKat");
    expect(screen.queryByText("Shelter ID")).not.toBeInTheDocument();
  });
});

describe("CatDetailPage adoption CTA", () => {
  it("keeps a direct animal listing CTA", async () => {
    renderDetail(makeCat());
    await loadedHeading("Miso");

    expect(
      screen.getByRole("heading", { name: "Interested in Miso?" }),
    ).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: /View adoption listing/i });
    expect(cta).toHaveAttribute("href", "https://example.com/adopt/miso");
    expect(
      screen.getByText("Opens Sunset Paws's listing in a new tab."),
    ).toBeInTheDocument();
  });

  it("uses organization adoption copy when a direct listing is unavailable", async () => {
    renderDetail(
      makeCat({
        adoptionUrl: "https://example.com/sunset-paws/adopt",
        adoptionUrlSource: "organizationAdoption",
        organization: {
          ...makeCat().organization,
          website: "https://example.com/sunset-paws",
        },
      }),
    );
    await loadedHeading("Miso");

    expect(
      screen.getByRole("link", { name: /Adopt through Sunset Paws/i }),
    ).toHaveAttribute("href", "https://example.com/sunset-paws/adopt");
    expect(
      screen.getByText(
        "We couldn't grab a direct link for this cat, but you can visit Sunset Paws's adoption page to learn more.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Visit website (opens in a new tab)",
      }),
    ).toHaveAttribute("href", "https://example.com/sunset-paws");
  });

  it("uses organization website copy and does not duplicate that destination", async () => {
    renderDetail(
      makeCat({
        adoptionUrl: "https://example.com/sunset-paws",
        adoptionUrlSource: "organizationWebsite",
        organization: {
          ...makeCat().organization,
          website: "https://example.com/sunset-paws/",
        },
      }),
    );
    await loadedHeading("Miso");

    expect(
      screen.getByRole("link", { name: /Visit shelter website/i }),
    ).toHaveAttribute("href", "https://example.com/sunset-paws");
    expect(
      screen.getByText(
        "We couldn't grab a direct link for this cat, but you can visit Sunset Paws to learn more.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Visit website" }),
    ).not.toBeInTheDocument();
  });

  it("uses the RescueGroups fallback copy", async () => {
    renderDetail(
      makeCat({
        adoptionUrl: "https://www.rescuegroups.org/",
        adoptionUrlSource: "fallback",
      }),
    );
    await loadedHeading("Miso");

    expect(
      screen.getByRole("link", { name: /View adoption listing/i }),
    ).toHaveAttribute("href", "https://www.rescuegroups.org/");
    expect(
      screen.getByText(
        "We couldn't grab a direct listing for this cat. This link will take you to RescueGroups instead.",
      ),
    ).toBeInTheDocument();
  });
});

describe("CatDetailPage sparse listing and favorites", () => {
  it("keeps a compact missing-bio state and adoption path without filler", async () => {
    const { container } = renderDetail(
      makeCat({
        photos: [],
        description: "No description provided yet.",
        traits: {},
        age: "Age unknown",
        ageGroup: "unknown",
        sex: "unknown",
        size: "unknown",
      }),
    );
    await loadedHeading("Miso");

    expect(
      screen.getByText("This shelter hasn’t added a bio for Miso yet."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Interested in Miso?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /View adoption listing/i }),
    ).toHaveAttribute("href", "https://example.com/adopt/miso");
    expect(screen.getByText("Shelter information")).toBeInTheDocument();
    expect(screen.getByText("Sunset Paws")).toBeInTheDocument();
    expect(container.querySelector("dl")).toBeNull();
    expect(screen.queryByText("Good with cats")).not.toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("🐱");
  });

  it("preserves known compatibility badges and hides the area when none exist", async () => {
    renderDetail(
      makeCat({
        traits: { goodWithCats: true, goodWithChildren: true, houseTrained: true },
      }),
    );
    await loadedHeading("Miso");
    expect(screen.getByText("Good with cats")).toBeInTheDocument();
    expect(screen.getByText("Good with kids")).toBeInTheDocument();
    expect(screen.getByText("House trained")).toBeInTheDocument();
  });

  it("keeps the favorite heart functional", async () => {
    renderDetail(makeCat());
    await loadedHeading("Miso");

    const favorite = screen.getByRole("button", {
      name: /Add Miso to favorites/i,
    });
    expect(favorite).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(favorite);
    expect(
      screen.getByRole("button", { name: /Remove Miso from favorites/i }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
