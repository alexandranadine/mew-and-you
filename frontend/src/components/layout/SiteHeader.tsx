import { Link } from "react-router-dom";
import { brand } from "../../config/brand";

export function SiteHeader() {
  return (
    <header className="border-b border-blush-100 bg-cream-50/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link
          to="/"
          className="focus-ring flex min-w-0 items-center gap-1.5 sm:gap-2"
        >
          <span aria-hidden="true" className="shrink-0 text-2xl">
            🐾
          </span>
          <span className="truncate font-display text-lg font-semibold text-mauve-700 sm:text-xl">
            {brand.name}
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="flex shrink-0 items-center gap-1 font-display text-sm font-medium text-mauve-500 sm:gap-2"
        >
          <Link
            to="/"
            className="focus-ring inline-flex min-h-11 items-center px-2.5 transition hover:text-mauve-700 sm:px-3"
          >
            Search
          </Link>
          <Link
            to="/favorites"
            className="focus-ring inline-flex min-h-11 items-center px-2.5 transition hover:text-mauve-700 sm:px-3"
          >
            Favorites
          </Link>
          <Link
            to="/about"
            className="focus-ring hidden min-h-11 items-center px-3 transition hover:text-mauve-700 sm:inline-flex"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
