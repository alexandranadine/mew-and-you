import { useState } from "react";
import {
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { CatTraitBadges } from "../components/cats/CatTraitBadges";
import { FavoriteButton } from "../components/cats/FavoriteButton";
import { SearchStateCard } from "../components/cats/SearchStateCard";
import { PageMeta } from "../components/seo/PageMeta";
import { useCatDetail } from "../hooks/useCatDetail";
import {
  formatCatDisplayName,
  getCatDetailAttributes,
  hasRealDescription,
  missingBioMessage,
} from "../lib/catDisplay";
import {
  catDetailLoadingSeo,
  catDetailMissingSeo,
  catDetailSeo,
  catJsonLd,
  getSiteOrigin,
  toAbsoluteUrl,
} from "../config/seo";
import type { Cat } from "../types/cat";

interface CatDetailLocationState {
  distanceMiles?: number;
}

export function CatDetailPage() {
  const { catId } = useParams<{ catId: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { data: cat, isPending, isError, error, refetch, isFetching } =
    useCatDetail(catId);
  const [galleryCatId, setGalleryCatId] = useState(catId);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [failedPhotoUrls, setFailedPhotoUrls] = useState<Set<string>>(
    () => new Set(),
  );

  // Direct URL / in-app navigation between cats must reset gallery state so
  // a prior selection or failed-image set doesn't carry over.
  if (galleryCatId !== catId) {
    setGalleryCatId(catId);
    setSelectedPhotoIndex(0);
    setFailedPhotoUrls(new Set());
  }

  function markPhotoFailed(url: string) {
    setFailedPhotoUrls((prev) => new Set(prev).add(url));
  }

  // Distance is only known in the context of a search (passed along when
  // navigating from a results card); there's no way to recompute it here
  // without re-geocoding, so it's simply omitted otherwise.
  const distanceMiles = (location.state as CatDetailLocationState | null)
    ?.distanceMiles;
  const zip = searchParams.get("zip");
  const backHref = zip ? `/cats?zip=${encodeURIComponent(zip)}` : "/";
  const backLabel = zip ? "← Back to results" : "← Back to search";

  if (!catId) {
    const meta = catDetailMissingSeo(undefined);
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <PageMeta
          title={meta.title}
          description={meta.description}
          canonicalPath={meta.canonicalPath}
          robots={meta.robots}
        />
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

  if (isPending) {
    const meta = catDetailLoadingSeo(catId);
    return (
      <div className="mx-auto max-w-4xl px-6 py-16">
        <PageMeta
          title={meta.title}
          description={meta.description}
          canonicalPath={meta.canonicalPath}
        />
        <SearchStateCard
          icon="🐾"
          title="Fetching this cat's profile…"
          message="One moment."
        />
      </div>
    );
  }

  if (isError) {
    const meta = catDetailLoadingSeo(catId);
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <PageMeta
          title={meta.title}
          description={meta.description}
          canonicalPath={meta.canonicalPath}
        />
        <SearchStateCard
          icon="⚠️"
          title="Something went wrong"
          message={
            error instanceof Error
              ? error.message
              : "We couldn't load this cat's profile. Please try again."
          }
        >
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn-primary"
          >
            {isFetching ? "Retrying…" : "Try again"}
          </button>
          <Link to={backHref} className="btn-secondary">
            {zip ? "Back to results" : "Back to search"}
          </Link>
        </SearchStateCard>
      </div>
    );
  }

  if (!cat) {
    const meta = catDetailMissingSeo(catId);
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <PageMeta
          title={meta.title}
          description={meta.description}
          canonicalPath={meta.canonicalPath}
          robots={meta.robots}
        />
        <SearchStateCard
          icon="🙀"
          title="We couldn't find that cat"
          message="This listing may have been adopted already, or the link might be incorrect."
        >
          <Link to={backHref} className="btn-primary">
            {zip ? "Back to results" : "Back to search"}
          </Link>
        </SearchStateCard>
      </div>
    );
  }

  const mainPhoto = cat.photos[selectedPhotoIndex] ?? cat.photos[0];
  const mainPhotoFailed = mainPhoto ? failedPhotoUrls.has(mainPhoto.url) : true;
  const hasBio = hasRealDescription(cat.description);
  const detailAttributes = getCatDetailAttributes(cat);
  const displayName = formatCatDisplayName(cat.name);
  const attributeGridClass =
    detailAttributes.length <= 1
      ? "grid-cols-1"
      : detailAttributes.length === 2
        ? "grid-cols-2"
        : "grid-cols-3";
  const adoptionCta = adoptionCtaCopy(cat);

  const meta = catDetailSeo(cat);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <PageMeta
        title={meta.title}
        description={meta.description}
        canonicalPath={meta.canonicalPath}
        image={meta.image}
        imageAlt={meta.imageAlt}
        jsonLd={catJsonLd(cat, toAbsoluteUrl(meta.canonicalPath, getSiteOrigin()))}
      />
      <Link
        to={backHref}
        className="focus-ring inline-block py-1 text-sm font-medium text-mauve-500 hover:text-mauve-700"
      >
        {backLabel}
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="min-w-0">
          {/* Fixed aspect ratio reserves space up front so the layout doesn't shift once the image loads. */}
          <div className="aspect-[4/3] w-full overflow-hidden rounded-3xl bg-blush-100 shadow-[var(--shadow-cozy)]">
            {mainPhoto && !mainPhotoFailed ? (
              <img
                src={mainPhoto.url}
                alt={`Photo of ${displayName}`}
                width={800}
                height={600}
                className="h-full w-full object-cover"
                fetchPriority="high"
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
              className="-mx-1 mt-3 flex gap-3 overflow-x-auto px-1 pb-1"
              role="group"
              aria-label={`${displayName}'s photos`}
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
                    className={`focus-ring h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${
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
                        width={80}
                        height={64}
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

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h1 className="min-w-0 break-words text-3xl font-semibold text-mauve-700">
              {displayName}
            </h1>
            <div className="flex shrink-0 items-center gap-2">
              {typeof distanceMiles === "number" && (
                <span className="pill">
                  {distanceMiles.toFixed(1)} mi away
                </span>
              )}
              <FavoriteButton
                catId={cat.id}
                catName={displayName}
                size="md"
              />
            </div>
          </div>

          <p className="mt-1 text-lg text-mauve-500">{cat.breed}</p>

          {detailAttributes.length > 0 && (
            <dl
              className={`mt-4 grid gap-2 text-center sm:gap-3 ${attributeGridClass}`}
            >
              {detailAttributes.map((attr) => (
                <div
                  key={attr.key}
                  className="min-w-0 rounded-2xl bg-blush-50 px-1.5 py-3 sm:px-2"
                >
                  <dt className="text-xs uppercase tracking-wide text-mauve-400">
                    {attr.label}
                  </dt>
                  <dd className="mt-1 break-words font-medium text-mauve-700">
                    {attr.value}
                    {attr.subvalue ? (
                      <span className="block text-xs text-mauve-400">
                        {attr.subvalue}
                      </span>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-5">
            <CatTraitBadges traits={cat.traits} />
          </div>

          <h2 className="mt-6 font-display text-lg font-semibold text-mauve-700">
            About {displayName}
          </h2>
          {hasBio ? (
            <p className="mt-2 leading-relaxed text-mauve-600">
              {cat.description.trim()}
            </p>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-mauve-400">
              {missingBioMessage(cat.name)}
            </p>
          )}

          <div className="card mt-6 p-5">
            <h2 className="font-display text-lg font-semibold break-words text-mauve-700">
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
            {adoptionCta.label}
            <span aria-hidden="true">↗</span>
          </a>
          <p className="mt-2 text-sm text-mauve-400">{adoptionCta.helper}</p>
        </div>
      </div>
    </div>
  );
}

function adoptionCtaCopy(cat: Cat): { label: string; helper: string } {
  const organizationName = cat.organization.name;
  switch (cat.adoptionUrlSource) {
    case "organizationAdoption":
      return {
        label: `Adopt through ${organizationName}`,
        helper: `We couldn't grab a direct link for this cat, but you can visit ${organizationName}'s adoption page to learn more.`,
      };
    case "organizationWebsite":
      return {
        label: `Visit ${organizationName}`,
        helper: `We couldn't grab a direct link for this cat, but you can visit ${organizationName} to learn more.`,
      };
    case "fallback":
      return {
        label: "View adoption listing",
        helper:
          "We couldn't grab a direct listing for this cat. This link will take you to RescueGroups instead.",
      };
    case "animal":
    default:
      return {
        label: "View adoption listing",
        helper: `Opens ${organizationName}'s listing in a new tab.`,
      };
  }
}
