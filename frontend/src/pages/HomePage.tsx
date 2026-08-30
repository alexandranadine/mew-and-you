import { CatCard } from "../components/cats/CatCard";
import { PawDivider } from "../components/decorative/PawDivider";
import { SearchForm } from "../components/search/SearchForm";
import { brand } from "../config/brand";
import { mockCats } from "../data/mockCats";

const FEATURED_CATS = mockCats.slice(0, 3);

export function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden px-6 pt-16 pb-12 sm:pt-24 sm:pb-16">
        {/* soft decorative blobs to echo the cozy stationery-shop mood */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blush-100 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-sage-100 blur-3xl"
        />

        <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
          <span className="pill mb-4">🌸 Serving {brand.serviceArea}</span>
          <h1 className="text-4xl font-semibold text-mauve-700 sm:text-5xl">
            {brand.name}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-mauve-500">
            {brand.tagline}
          </p>
          <p className="mt-2 max-w-xl text-mauve-400">{brand.description}</p>

          <div className="mt-10 w-full max-w-md">
            <SearchForm />
          </div>
        </div>
      </section>

      <PawDivider className="pb-10" />

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-mauve-700">
            A few cats waiting for you
          </h2>
          <p className="mt-2 text-mauve-400">
            Sample listings shown here — search above to see cats near you.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_CATS.map((cat) => (
            <CatCard key={cat.id} cat={cat} />
          ))}
        </div>
      </section>
    </div>
  );
}
