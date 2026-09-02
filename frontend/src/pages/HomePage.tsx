import { CatCard } from "../components/cats/CatCard";
import { CatCardSkeleton } from "../components/cats/CatCardSkeleton";
import { PawDivider } from "../components/decorative/PawDivider";
import { SearchForm } from "../components/search/SearchForm";
import { brand } from "../config/brand";
import { useCatsSearch } from "../hooks/useCatsSearch";
import RotatingTagline from "../components/layout/RotatingTagline";

// A fixed, illustrative search so the homepage has something to show before
// the visitor searches themselves — still served through our real API.
const FEATURED_QUERY = {
  zip: "90026",
  radiusMiles: 50,
  filters: {},
  sort: "distance",
} as const;

export function HomePage() {
  const { data, isLoading } = useCatsSearch(FEATURED_QUERY);
  const featuredCats = data?.cats.slice(0, 3) ?? [];

  return (
    <div>
      <section className="relative overflow-hidden px-6 pt-16 pb-8 sm:pt-24 sm:pb-8">
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
          {/* <span className="pill mb-4 px-4 py-2 text-[13px]">
            🌸 Serving {brand.serviceArea}
          </span> */}
          <h1 className="text-4xl font-semibold text-mauve-700 sm:text-5xl">
            {brand.name}
          </h1>
          <p className="mt-4 max-w-xl font-semibold text-lg text-mauve-500">
            <RotatingTagline />
          </p>
          <p className="mt-2 max-w-xl text-mauve-400">{brand.description}</p>

          <div className="relative mt-40 w-full max-w-md">
            <img
              src="/images/mew-and-you-cat-peek.png"
              alt=""
              aria-hidden="true"
              className="
                          pointer-events-none
                          absolute
                          left-1/2
                          top-0
                          z-30
                          w-[320px]
                          -translate-x-1/2
                          -translate-y-[74.5%]
                          select-none
                          sm:w-[450px]
                      "
            />

            <div className="relative z-10">
              <SearchForm />
            </div>
          </div>
        </div>
      </section>

      <PawDivider />

      {(isLoading || featuredCats.length > 0) && (
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold text-mauve-700">
              Your puurrfect pal is waiting for you~{" "}
            </h2>
            <p className="mt-2 text-mauve-400">
              Sample listings shown here — search above to see cats near you!
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <CatCardSkeleton key={index} />
                ))
              : featuredCats.map((cat) => <CatCard key={cat.id} cat={cat} />)}
          </div>
        </section>
      )}
    </div>
  );
}
