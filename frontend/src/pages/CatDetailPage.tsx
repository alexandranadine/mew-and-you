import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { CatTraitBadges } from "../components/cats/CatTraitBadges";
import { SearchStateCard } from "../components/cats/SearchStateCard";
import { useCatDetail } from "../hooks/useCatDetail";
import { ageGroupLabel } from "../lib/searchOptions";
import { getDistanceInMiles } from "../lib/distance";
import { getCoordinatesForZip, isValidZipFormat } from "../lib/zipLookup";

export function CatDetailPage() {
  const { catId } = useParams<{ catId: string }>();
  const [searchParams] = useSearchParams();
  const { data: cat, isLoading } = useCatDetail(catId);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const zip = searchParams.get("zip");
  const distanceMiles =
    cat && zip && isValidZipFormat(zip)
      ? (() => {
          const origin = getCoordinatesForZip(zip);
          return origin ? getDistanceInMiles(origin, cat.location) : undefined;
        })()
      : undefined;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16">
        <SearchStateCard icon="🐾" title="Fetching this cat's profile…" message="One moment." />
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
  const backHref = zip ? `/cats?zip=${encodeURIComponent(zip)}` : "/";

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link
        to={backHref}
        className="text-sm font-medium text-mauve-500 hover:text-mauve-700"
      >
        ← Back to results
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <div className="aspect-[4/3] w-full overflow-hidden rounded-3xl bg-blush-100 shadow-[var(--shadow-cozy)]">
            {mainPhoto ? (
              <img
                src={mainPhoto.url}
                alt={`Photo of ${cat.name}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-6xl">
                🐱
              </div>
            )}
          </div>

          {cat.photos.length > 1 && (
            <div className="mt-3 flex gap-3">
              {cat.photos.map((photo, index) => (
                <button
                  key={photo.url}
                  type="button"
                  onClick={() => setSelectedPhotoIndex(index)}
                  className={`h-16 w-20 overflow-hidden rounded-xl border-2 transition ${
                    index === selectedPhotoIndex
                      ? "border-mauve-500"
                      : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                >
                  <img
                    src={photo.thumbnailUrl ?? photo.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
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

          <p className="mt-5 leading-relaxed text-mauve-600">
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
                className="mt-1 inline-block text-sm font-medium text-mauve-600 underline-offset-2 hover:underline"
              >
                Visit website
              </a>
            )}
          </div>

          <a
            href={cat.adoptionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-6 w-full sm:w-auto"
          >
            <span aria-hidden="true">🐾</span>
            View Adoption Listing
          </a>
        </div>
      </div>
    </div>
  );
}

