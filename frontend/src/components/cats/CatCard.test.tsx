import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { CatCard } from "./CatCard";
import {
  CAT_CARD_IMAGE_SIZES,
  CAT_PHOTO_FULL_WIDTH,
  CAT_PHOTO_THUMB_WIDTH,
} from "../../lib/catPhoto";
import { makeCat } from "../../test/catFixture";

afterEach(() => {
  cleanup();
});

function renderCard(cat = makeCat()) {
  return render(
    <MemoryRouter>
      <CatCard cat={cat} />
    </MemoryRouter>,
  );
}

describe("CatCard missing-data display", () => {
  it("omits unknown attributes from the metadata row", () => {
    renderCard(
      makeCat({
        age: "Age unknown",
        ageGroup: "unknown",
        sex: "unknown",
        size: "large",
      }),
    );

    expect(screen.getByText("Large")).toBeInTheDocument();
    expect(screen.queryByText(/unknown/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Age unknown/i)).not.toBeInTheDocument();
  });

  it("keeps middot separators correct when sex is omitted", () => {
    renderCard(makeCat({ sex: "unknown" }));
    expect(screen.getByText("2 years · Medium")).toBeInTheDocument();
  });

  it("hides the metadata row entirely when age, sex, and size are unknown", () => {
    const { container } = renderCard(
      makeCat({
        age: "Age unknown",
        ageGroup: "unknown",
        sex: "unknown",
        size: "unknown",
      }),
    );

    expect(container.textContent).not.toMatch(/ · /);
    expect(screen.queryByText(/unknown/i)).not.toBeInTheDocument();
  });

  it("shows the intentional photo placeholder instead of a broken image", () => {
    const { container } = renderCard(makeCat({ photos: [] }));

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByRole("heading", { name: "Miso" })).toBeInTheDocument();
    expect(container.textContent).toContain("🐱");
  });

  it("displays a friendly title-cased name for ALL-CAPS shelter names", () => {
    renderCard(makeCat({ name: "ROOTY TOOTY" }));
    expect(
      screen.getByRole("heading", { name: "Rooty Tooty" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Meet Rooty Tooty/)).toBeInTheDocument();
  });
});

describe("CatCard photo selection", () => {
  const thumb = "https://cdn.example.org/miso-small.jpg";
  const full = "https://cdn.example.org/miso-large.jpg";

  it("uses responsive srcSet/sizes when thumbnail and full URLs differ", () => {
    const { container } = renderCard(
      makeCat({
        photos: [{ url: full, thumbnailUrl: thumb }],
      }),
    );

    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("src", full);
    expect(img).toHaveAttribute(
      "srcSet",
      `${thumb} ${CAT_PHOTO_THUMB_WIDTH}w, ${full} ${CAT_PHOTO_FULL_WIDTH}w`,
    );
    expect(img).toHaveAttribute("sizes", CAT_CARD_IMAGE_SIZES);
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("decoding", "async");
  });

  it("omits srcSet when only one URL is available", () => {
    const { container } = renderCard(
      makeCat({ photos: [{ url: full }] }),
    );

    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", full);
    expect(img).not.toHaveAttribute("srcSet");
    expect(img).not.toHaveAttribute("sizes");
  });

  it("falls back to the remaining URL after the chosen candidate errors", () => {
    const { container } = renderCard(
      makeCat({
        photos: [{ url: full, thumbnailUrl: thumb }],
      }),
    );

    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    Object.defineProperty(img!, "currentSrc", {
      configurable: true,
      get: () => full,
    });
    fireEvent.error(img!);

    const fallback = container.querySelector("img");
    expect(fallback).toHaveAttribute("src", thumb);
    expect(fallback).not.toHaveAttribute("srcSet");
  });

  it("shows the placeholder after every photo URL fails", () => {
    const { container } = renderCard(
      makeCat({
        photos: [{ url: full, thumbnailUrl: thumb }],
      }),
    );

    let img = container.querySelector("img");
    Object.defineProperty(img!, "currentSrc", {
      configurable: true,
      get: () => full,
    });
    fireEvent.error(img!);

    img = container.querySelector("img");
    Object.defineProperty(img!, "currentSrc", {
      configurable: true,
      get: () => thumb,
    });
    fireEvent.error(img!);

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("🐱");
  });
});
