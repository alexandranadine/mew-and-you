import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { CatCard } from "./CatCard";
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
