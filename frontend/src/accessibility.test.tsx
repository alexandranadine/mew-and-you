import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CatCard } from "./components/cats/CatCard";
import { CatFilterBar } from "./components/cats/CatFilterBar";
import { FavoriteButton } from "./components/cats/FavoriteButton";
import { SearchStateCard } from "./components/cats/SearchStateCard";
import { AppLayout } from "./components/layout/AppLayout";
import { SearchForm } from "./components/search/SearchForm";
import { writeFavoriteIds } from "./lib/favoritesStorage";
import { HomePage } from "./pages/HomePage";
import { makeCat } from "./test/catFixture";

afterEach(() => {
  cleanup();
  writeFavoriteIds([]);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("form labels and ZIP validity", () => {
  it("associates ZIP and radius labels and exposes invalid ZIP state", () => {
    render(
      <MemoryRouter>
        <SearchForm />
      </MemoryRouter>,
    );

    const zip = screen.getByLabelText("ZIP code");
    expect(zip).toHaveAttribute("aria-invalid", "false");
    expect(zip).not.toHaveAttribute("aria-describedby");
    expect(screen.getByLabelText("Search radius")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Find cats nearby" }));

    expect(zip).toHaveAttribute("aria-invalid", "true");
    expect(zip).toHaveAttribute("aria-describedby", "zip-error");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter a ZIP code to start searching.",
    );
  });
});

describe("filter chips", () => {
  it("toggles aria-pressed from the visible chip label", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <CatFilterBar
        filters={{}}
        sort="distance"
        organizationOptions={[]}
        onChange={onChange}
        onReset={() => undefined}
        hasActiveFilters={false}
      />,
    );

    const female = screen.getByRole("button", { name: "Female" });
    expect(female).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(female);
    expect(onChange).toHaveBeenCalledWith({ sex: ["female"] });

    rerender(
      <CatFilterBar
        filters={{ sex: ["female"] }}
        sort="distance"
        organizationOptions={[]}
        onChange={onChange}
        onReset={() => undefined}
        hasActiveFilters
      />,
    );
    expect(screen.getByRole("button", { name: "Female" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByLabelText("Organization")).toBeInTheDocument();
    expect(screen.getByLabelText("Sort by")).toBeInTheDocument();
  });
});

describe("favorite accessible names", () => {
  it("updates the name and pressed state after toggling", () => {
    render(<FavoriteButton catId="1" catName="Riley" />);

    const button = screen.getByRole("button", {
      name: "Add Riley to favorites",
    });
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true");

    fireEvent.click(button);

    expect(
      screen.getByRole("button", { name: "Remove Riley from favorites" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});

describe("landmarks and skip link", () => {
  it("exposes a skip link that targets main", () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<p>Page body</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const skip = screen.getByRole("link", { name: "Skip to main content" });
    expect(skip).toHaveAttribute("href", "#main-content");
    expect(document.getElementById("main-content")?.tagName).toBe("MAIN");
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});

describe("decorative imagery and status semantics", () => {
  it("hides the homepage peek illustration from assistive tech", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ cats: [] }),
      }),
    );
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const peek = document.querySelector(
      'img[src="/images/mew-and-you-cat-peek-v3.png"]',
    );
    expect(peek).toHaveAttribute("alt", "");
    expect(peek).toHaveAttribute("aria-hidden", "true");
  });

  it("hides the missing-photo placeholder from the accessibility tree", () => {
    const { container } = render(
      <MemoryRouter>
        <CatCard cat={makeCat({ photos: [] })} />
      </MemoryRouter>,
    );

    expect(container.querySelector("img")).toBeNull();
    const hidden = [...container.querySelectorAll('[aria-hidden="true"]')];
    expect(hidden.some((node) => node.textContent?.includes("🐱"))).toBe(true);
  });

  it("marks empty search prompts as status and failures as alerts", () => {
    const { rerender } = render(
      <SearchStateCard title="No cats matched your search" message="Try again." />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "No cats matched your search",
    );

    rerender(
      <SearchStateCard
        headingLevel={1}
        icon="⚠️"
        title="Something went wrong"
        message="Please try again."
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    expect(
      screen.getByRole("heading", { level: 1, name: "Something went wrong" }),
    ).toBeInTheDocument();
  });
});
