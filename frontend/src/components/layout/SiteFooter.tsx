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
      </div>
    </footer>
  );
}
