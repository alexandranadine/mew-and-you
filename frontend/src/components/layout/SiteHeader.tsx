import { Link } from "react-router-dom";
import { brand } from "../../config/brand";

export function SiteHeader() {
  return (
    <header className="border-b border-blush-100 bg-cream-50/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span aria-hidden="true" className="text-2xl">
            🐾
          </span>
          <span className="font-display text-xl font-semibold text-mauve-700">
            {brand.name}
          </span>
        </Link>

        <nav className="flex items-center gap-6 font-display text-sm font-medium text-mauve-500">
          <Link to="/" className="transition hover:text-mauve-700">
            Search
          </Link>
          <a
            href="#about"
            className="hidden transition hover:text-mauve-700 sm:inline"
          >
            About
          </a>
        </nav>
      </div>
    </header>
  );
}
