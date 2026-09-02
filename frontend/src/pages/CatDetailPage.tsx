import { useState } from "react";
import {
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { CatTraitBadges } from "../components/cats/CatTraitBadges";
import { SearchStateCard } from "../components/cats/SearchStateCard";
import { useCatDetail } from "../hooks/useCatDetail";
import { ageGroupLabel } from "../lib/searchOptions";

interface CatDetailLocationState {
  distanceMiles?: number;
}

export function CatDetailPage() {
  const { catId } = useParams<{ catId: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { data: cat, isLoading } = useCatDetail(catId);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [failedPhotoUrls, setFailedPhotoUrls] = useState<Set<string>>(
    () => new Set(),
  );

  function markPhotoFailed(url: string) {
    setFailedPhotoUrls((prev) => new Set(prev).add(url));
  }

  // Distance is only known in the context of a search (passed along when
  // navigating from a results card); there's no way to recompute it here
  // without re-geocoding, so it's simply omitted otherwise.
  const distanceMiles = (location.state as CatDetailLocationState | null)
    ?.distanceMiles;
  const zip = searchParams.get("zip");

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16">
        <SearchStateCard
          icon="🐾"
          title="Fetching this cat's profile…"
          message="One moment."
        />
      </div>
    );
  }

  if (!cat) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <SearchStateCard
          icon="🙀"
          title="We couldn't find that cat"
          message="This listing may have been adopted already, or the link might be incorrect."
        >
          <Link to="/" className="btn-primary">
            Back to search
          </Link>
        </SearchStateCard>
      </div>
    );
  }

  const mainPhoto = cat.photos[selectedPhotoIndex] ?? cat.photos[0];
  const mainPhotoFailed = mainPhoto ? failedPhotoUrls.has(mainPhoto.url) : true;
  const backHref = zip ? `/cats?zip=${encodeURIComponent(zip)}` : "/";

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link
        to={backHref}
        className="focus-ring inline-block py-1 text-sm font-medium text-mauve-500 hover:text-mauve-700"
      >
        ← Back to results
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          {/* Fixed aspect ratio reserves space up front so the layout doesn't shift once the image loads. */}
          <div className="aspect-[4/3] w-full overflow-hidden rounded-3xl bg-blush-100 shadow-[var(--shadow-cozy)]">
            {mainPhoto && !mainPhotoFailed ? (
              <img
                src={mainPhoto.url}
                alt={`Photo of ${cat.name}`}
                className="h-full w-full object-cover"
                decoding="async"
                onError={() => markPhotoFailed(mainPhoto.url)}
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex h-full w-full items-center justify-center text-6xl"
              >
                🐱
              </div>
            )}
          </div>

          {cat.photos.length > 1 && (
            <div
              className="mt-3 flex gap-3"
              role="group"
              aria-label={`${cat.name}'s photos`}
            >
              {cat.photos.map((photo, index) => {
                const thumbFailed = failedPhotoUrls.has(
                  photo.thumbnailUrl ?? photo.url,
                );
                const isSelected = index === selectedPhotoIndex;
                return (
                  <button
                    key={photo.url}
                    type="button"
                    onClick={() => setSelectedPhotoIndex(index)}
                    aria-label={`View photo ${index + 1} of ${cat.photos.length}`}
                    aria-current={isSelected}
                    className={`focus-ring h-16 w-20 overflow-hidden rounded-xl border-2 transition ${
                      isSelected
                        ? "border-mauve-500"
                        : "border-transparent opacity-80 hover:opacity-100"
                    }`}
                  >
                    {thumbFailed ? (
                      <div
                        aria-hidden="true"
                        className="flex h-full w-full items-center justify-center bg-blush-100 text-xl"
                      >
                        🐱
                      </div>
                    ) : (
                      <img
                        src={photo.thumbnailUrl ?? photo.url}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                        onError={() =>
                          markPhotoFailed(photo.thumbnailUrl ?? photo.url)
                        }
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-3xl font-semibold text-mauve-700">
              {cat.name}
            </h1>
            {typeof distanceMiles === "number" && (
              <span className="pill shrink-0">
                {distanceMiles.toFixed(1)} mi away
              </span>
            )}
          </div>

          <p className="mt-1 text-lg text-mauve-500">{cat.breed}</p>

          <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-blush-50 px-2 py-3">
              <dt className="text-xs uppercase tracking-wide text-mauve-400">
                Age
              </dt>
              <dd className="mt-1 font-medium text-mauve-700">
                {cat.age}
                <span className="block text-xs text-mauve-400">
                  {ageGroupLabel(cat.ageGroup)}
                </span>
              </dd>
            </div>
            <div className="rounded-2xl bg-blush-50 px-2 py-3">
              <dt className="text-xs uppercase tracking-wide text-mauve-400">
                Sex
              </dt>
              <dd className="mt-1 font-medium capitalize text-mauve-700">
                {cat.sex}
              </dd>
            </div>
            <div className="rounded-2xl bg-blush-50 px-2 py-3">
              <dt className="text-xs uppercase tracking-wide text-mauve-400">
                Size
              </dt>
              <dd className="mt-1 font-medium capitalize text-mauve-700">
                {cat.size}
              </dd>
            </div>
          </dl>

          <div className="mt-5">
            <CatTraitBadges traits={cat.traits} />
          </div>

          <h2 className="mt-6 font-display text-lg font-semibold text-mauve-700">
            About {cat.name}
          </h2>
          <p className="mt-2 leading-relaxed text-mauve-600">
            {cat.description}
          </p>

          <div className="card mt-6 p-5">
            <h2 className="font-display text-lg font-semibold text-mauve-700">
              {cat.organization.name}
            </h2>
            <p className="mt-1 text-sm text-mauve-500">
              {cat.organization.city}, {cat.organization.state}{" "}
              {cat.organization.zip}
            </p>
            {cat.organization.phone && (
              <p className="mt-1 text-sm text-mauve-500">
                {cat.organization.phone}
              </p>
            )}
            {cat.organization.website && (
              <a
                href={cat.organization.website}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring mt-1 inline-block text-sm font-medium text-mauve-600 underline-offset-2 hover:underline"
              >
                Visit website
              </a>
            )}
          </div>

          <a
            href={cat.adoptionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-6 w-full justify-center px-8 py-4 text-base sm:w-auto"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4 -rotate-32 text-cream-50"
              fill="currentColor"
            >
              <circle cx="12" cy="15" r="5" />
              <circle cx="5" cy="8" r="2.4" />
              <circle cx="10" cy="4" r="2.4" />
              <circle cx="15" cy="4" r="2.4" />
              <circle cx="19" cy="8" r="2.4" />
            </svg>
            View Adoption Listing
            <span aria-hidden="true">↗</span>
          </a>
          <p className="mt-2 text-sm text-mauve-400">
            Opens {cat.organization.name}'s listing in a new tab
          </p>
        </div>
      </div>
    </div>
  );
}
