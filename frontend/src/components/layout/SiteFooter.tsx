import { Link } from "react-router-dom";
import { brand } from "../../config/brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-blush-100 bg-cream-100/60">
      <div className="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-mauve-400">
        <p>
          {brand.name} aggregates adoptable cat listings from shelters and
          rescues across {brand.serviceArea}. Always confirm availability
          directly with the organization.
        </p>
        <p className="mt-2">🐾 Made with love for cats without homes yet.</p>
        <p className="mt-3">
          <Link
            to="/about"
            className="focus-ring font-medium text-mauve-500 hover:text-mauve-700"
          >
            About
          </Link>
        </p>
      </div>
    </footer>
  );
}
