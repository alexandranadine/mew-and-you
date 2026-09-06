import { Link } from "react-router-dom";
import { brand } from "../../config/brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-blush-100 bg-cream-100/60">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm leading-relaxed text-mauve-400 sm:px-6">
        <p className="text-pretty">
          {brand.name} aggregates adoptable cat listings from shelters and
          rescues across {brand.serviceArea}. Always confirm availability
          directly with the organization.
        </p>
        <p className="mt-2">
          <img
            src="/favicon.svg"
            alt=""
            aria-hidden="true"
            width={32}
            height={32}
            decoding="async"
            className="mr-1 inline-block h-[1em] w-auto align-[-0.125em]"
          />
          Made with love for cats without homes yet.
        </p>
        <p className="mt-3 flex flex-wrap items-center justify-center gap-x-1 gap-y-1">
          <Link
            to="/favorites"
            className="focus-ring inline-flex min-h-11 items-center px-3 font-medium text-mauve-500 hover:text-mauve-700"
          >
            Favorites
          </Link>
          <Link
            to="/about"
            className="focus-ring inline-flex min-h-11 items-center px-3 font-medium text-mauve-500 hover:text-mauve-700"
          >
            About
          </Link>
        </p>
      </div>
    </footer>
  );
}
